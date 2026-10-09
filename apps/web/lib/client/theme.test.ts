import { beforeEach, describe, expect, it, vi } from 'vitest';

// Minimal browser globals: storage, the colour-scheme media query and <html>'s dataset.
let store: Map<string, string>;
let prefersLight: boolean;
let mediaListeners: Set<() => void>;
const html = { dataset: {} as Record<string, string> };

beforeEach(() => {
  vi.resetModules();
  store = new Map();
  prefersLight = false;
  mediaListeners = new Set();
  html.dataset = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return prefersLight;
    },
    addEventListener: (_: string, l: () => void) => mediaListeners.add(l),
    removeEventListener: (_: string, l: () => void) => mediaListeners.delete(l),
  }));
  vi.stubGlobal('document', { documentElement: html });
});

const load = () => import('./theme');

describe('theme', () => {
  it('follows the device until a choice is saved', async () => {
    const { getTheme } = await load();
    expect(getTheme()).toBe('dark');
    prefersLight = true;
    expect(getTheme()).toBe('light');
  });

  it('a saved choice wins over the device and is applied to <html>', async () => {
    const { getTheme, setTheme } = await load();
    prefersLight = true;
    setTheme('dark');
    expect(getTheme()).toBe('dark');
    expect(store.get('theme')).toBe('dark');
    expect(html.dataset.theme).toBe('dark');
  });

  it('ignores junk in storage', async () => {
    store.set('theme', 'purple');
    const { getTheme } = await load();
    expect(getTheme()).toBe('dark');
  });

  it('still applies the choice when storage is blocked', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    const { getTheme, setTheme } = await load();
    expect(getTheme()).toBe('dark');
    setTheme('light');
    expect(html.dataset.theme).toBe('light');
  });

  it('notifies subscribers on a change and on device changes, until unsubscribed', async () => {
    const { setTheme, subscribeTheme } = await load();
    const listener = vi.fn();
    const unsubscribe = subscribeTheme(listener);
    setTheme('light');
    mediaListeners.forEach((l) => l());
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    setTheme('dark');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(mediaListeners.size).toBe(0);
  });
});
