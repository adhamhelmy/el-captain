import { describe, expect, it } from 'vitest';
import { addWeeks, fromWallClock, wallClock, weekDates } from './app-time';

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

describe('weekDates', () => {
  it('starts on the Saturday on or before today, in Cairo', () => {
    // Wed 21 Oct 2026, 23:30 UTC is already Thursday 22 Oct in Cairo.
    expect(weekDates(0, new Date('2026-10-21T23:30:00Z'))).toEqual([
      '2026-10-17',
      '2026-10-18',
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
    ]);
  });
  it('treats Saturday as the first day and Friday as the last', () => {
    expect(weekDates(0, new Date('2026-10-17T10:00:00Z'))[0]).toBe('2026-10-17');
    expect(weekDates(0, new Date('2026-10-23T10:00:00Z'))[0]).toBe('2026-10-17');
  });
  it('steps a week per offset, across months', () => {
    expect(weekDates(2, new Date('2026-10-21T10:00:00Z'))).toEqual([
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
    ]);
  });
});
