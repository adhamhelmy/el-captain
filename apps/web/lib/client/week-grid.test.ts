import { describe, expect, it } from 'vitest';
import { hourRange, layoutDay } from './week-grid';

// 16:00 UTC is 19:00 in Cairo in October (UTC+3).
const at = (h: number, m = 0) => new Date(Date.UTC(2026, 9, 21, h - 3, m));
const s = (id: string, h: number, m: number, dur: number) => ({ id, startsAt: at(h, m), durationMin: dur });

describe('hourRange', () => {
  it('spans the earliest start to the latest end, rounded out to whole hours', () => {
    expect(hourRange([s('a', 7, 30, 60), s('b', 18, 30, 90)])).toEqual({ start: 7, end: 20 });
  });
  it('falls back to 7 AM to 9 PM with no sessions', () => {
    expect(hourRange([])).toEqual({ start: 7, end: 21 });
  });
});

describe('layoutDay', () => {
  it('places a session by start and length', () => {
    expect(layoutDay([s('a', 9, 30, 90)], 7)).toEqual([{ id: 'a', top: 2.5, height: 1.5, col: 0, cols: 1 }]);
  });
  it('splits the width between overlapping sessions only', () => {
    const out = layoutDay([s('a', 9, 0, 60), s('b', 9, 30, 60), s('c', 12, 0, 60)], 7);
    expect(out.map(({ id, col, cols }) => [id, col, cols])).toEqual([
      ['a', 0, 2],
      ['b', 1, 2],
      ['c', 0, 1],
    ]);
  });
  it('reuses a slot once the session in it has ended', () => {
    const out = layoutDay([s('a', 9, 0, 120), s('b', 9, 0, 30), s('c', 9, 30, 30)], 7);
    expect(out.map(({ id, col, cols }) => [id, col, cols])).toEqual([
      ['b', 0, 2],
      ['a', 1, 2],
      ['c', 0, 2],
    ]);
  });
});
