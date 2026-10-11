/**
 * Theme: follows prefers-color-scheme (handled in CSS) until the user flips the toggle, which
 * saves 'light' or 'dark' to localStorage and sets data-theme on <html>.
 */
export type Theme = 'light' | 'dark';

const KEY = 'theme';
const QUERY = '(prefers-color-scheme: light)';
const listeners = new Set<() => void>();

/** Inline <head> script: applies the saved choice before first paint, so there's no flash. */
export const themeInitScript = `try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

function saved(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

/** The theme currently showing: the saved choice, else the device setting. */
export function getTheme(): Theme {
  return saved() ?? (matchMedia(QUERY).matches ? 'light' : 'dark');
}

export function setTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  document.documentElement.dataset.theme = t;
  listeners.forEach((l) => l());
}

export function subscribeTheme(listener: () => void) {
  const media = matchMedia(QUERY);
  listeners.add(listener);
  media.addEventListener('change', listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener('change', listener);
  };
}

/** What the user picked: a fixed theme, or "system" to follow the device. */
export type ThemeChoice = Theme | 'system';

export const getThemeChoice = (): ThemeChoice => saved() ?? 'system';

/** "system" forgets the saved theme, so the CSS goes back to following prefers-color-scheme. */
export function setThemeChoice(choice: ThemeChoice) {
  if (choice !== 'system') return setTheme(choice);
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: nothing was saved anyway.
  }
  delete document.documentElement.dataset.theme;
  listeners.forEach((l) => l());
}
