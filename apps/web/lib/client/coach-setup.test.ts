import { describe, expect, it } from 'vitest';
import { setupComplete, setupSteps } from './coach-setup';

const done = (d: Parameters<typeof setupSteps>[0]) => setupSteps(d).map((s) => [s.key, s.done]);

describe('setupSteps', () => {
  it('starts with only the approval done', () => {
    expect(done({ venueCount: 0, sessionCount: 0, privatePrice: null, privateDuration: null })).toEqual([
      ['approved', true],
      ['location', false],
      ['session', false],
      ['pricing', false],
    ]);
  });
  it('ticks each step from the data', () => {
    expect(done({ venueCount: 1, sessionCount: 3, privatePrice: 800, privateDuration: 60 }).every(([, ok]) => ok)).toBe(true);
  });
  it('needs both price and length for private pricing', () => {
    expect(setupSteps({ venueCount: 1, sessionCount: 1, privatePrice: 800, privateDuration: null })[3].done).toBe(false);
  });
  it('is complete only once every step is done', () => {
    expect(setupComplete(setupSteps({ venueCount: 1, sessionCount: 1, privatePrice: 800, privateDuration: 60 }))).toBe(true);
    expect(setupComplete(setupSteps({ venueCount: 1, sessionCount: 0, privatePrice: 800, privateDuration: 60 }))).toBe(false);
  });
  it('links unfinished steps to where they get done', () => {
    expect(setupSteps({ venueCount: 0, sessionCount: 0, privatePrice: null, privateDuration: null }).map((s) => s.href)).toEqual([
      null,
      '/coach/venues',
      '/coach/sessions/me?add=1',
      '/coach/profile#private',
    ]);
  });
});
