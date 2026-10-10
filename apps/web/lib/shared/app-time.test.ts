import { describe, expect, it } from 'vitest';
import { addWeeks, fromWallClock, wallClock } from './app-time';

describe('wallClock / fromWallClock (Africa/Cairo)', () => {
  it('reads a UTC instant as Cairo wall-clock time', () => {
    // 16:00Z on 2026-10-22 is 19:00 in Cairo (summer time, UTC+3).
    expect(wallClock(new Date('2026-10-22T16:00:00Z'))).toEqual({ date: '2026-10-22', time: '19:00' });
    // 17:00Z on 2026-11-05 is 19:00 in Cairo (winter time, UTC+2).
    expect(wallClock(new Date('2026-11-05T17:00:00Z'))).toEqual({ date: '2026-11-05', time: '19:00' });
  });

  it('turns Cairo wall-clock time back into the UTC instant', () => {
    expect(fromWallClock({ date: '2026-10-22', time: '19:00' })?.toISOString()).toBe('2026-10-22T16:00:00.000Z');
    expect(fromWallClock({ date: '2026-11-05', time: '19:00' })?.toISOString()).toBe('2026-11-05T17:00:00.000Z');
  });

  it('rejects malformed input', () => {
    expect(fromWallClock({ date: '2026-13-01', time: '19:00' })).toBeNull();
    expect(fromWallClock({ date: '2026-10-22', time: '7pm' })).toBeNull();
    expect(fromWallClock({ date: '', time: '' })).toBeNull();
  });
});

describe('addWeeks', () => {
  it('keeps the wall-clock time across the end of summer time', () => {
    const first = new Date('2026-10-22T16:00:00Z'); // Thu 19:00 Cairo
    const third = addWeeks(first, 2)!; // Thu 2026-11-05
    expect(wallClock(third)).toEqual({ date: '2026-11-05', time: '19:00' });
    expect(third.getTime() - first.getTime()).toBe((14 * 24 + 1) * 60 * 60 * 1000);
  });

  it('crosses a month end', () => {
    expect(wallClock(addWeeks(new Date('2026-12-28T08:00:00Z'), 1)!)).toEqual({ date: '2027-01-04', time: '10:00' });
  });
});
