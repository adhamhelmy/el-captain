import type { AppStateStatus } from 'react-native';

/** Re-check the account at most this often when the app comes back to the foreground. */
export const REFRESH_EVERY_MS = 60_000;

export const shouldRefresh = (state: AppStateStatus, lastCheck: number, now: number) =>
  state === 'active' && now - lastCheck >= REFRESH_EVERY_MS;
