import { api } from './client';

/**
 * The last answer for each GET path, so a tab opens on what it showed before (or what sign-in prefetched) while it
 * asks again. Screens still load on focus; this only fills the first frame.
 */
const store = new Map<string, unknown>();
// Bumped on clear, so an answer still on its way for the previous account is dropped when it lands.
let generation = 0;

export const peek = <T,>(path: string) => store.get(path) as T | undefined;

// Requests still on their way, so a screen asking for what a prefetch already asked shares that one request.
const pending = new Map<string, Promise<unknown>>();

/** GET from the server, keeping the answer for the next screen that asks. */
export function load<T>(path: string): Promise<T> {
  const running = pending.get(path);
  if (running) return running as Promise<T>;
  const asked = generation;
  const request = api<T>(path)
    .then((value) => {
      if (asked === generation) store.set(path, value);
      return value;
    })
    .finally(() => {
      if (pending.get(path) === request) pending.delete(path);
    });
  pending.set(path, request);
  return request;
}

/** Loads the paths in the background; a failure only means that page loads when opened. Skips what is already kept. */
export async function prefetch(paths: readonly string[]) {
  await Promise.allSettled(paths.filter((p) => !store.has(p)).map((p) => load(p)));
}

/** Keeps a fresher answer than the last GET, such as the session a booking returned, so the next visit doesn't open on the old one. */
export function remember(path: string, value: unknown) {
  store.set(path, value);
}

/** Forgets one path after a change that makes it out of date, so the next visit waits for the server instead. */
export function forget(path: string) {
  store.delete(path);
}

export function clearCache() {
  store.clear();
  pending.clear();
  generation++;
}
