import { shouldRefresh } from './refresh';

describe('shouldRefresh', () => {
  it('re-checks the account when the app comes back after a minute or more', () => {
    expect(shouldRefresh('active', 0, 60_000)).toBe(true);
  });

  it('skips quick app switches and background states', () => {
    expect(shouldRefresh('active', 0, 30_000)).toBe(false);
    expect(shouldRefresh('background', 0, 120_000)).toBe(false);
  });
});
