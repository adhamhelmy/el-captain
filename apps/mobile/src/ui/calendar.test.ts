import { addMonths, addYears, clampMonth, inRange, monthGrid, startMonth } from './calendar';

describe('calendar', () => {
  it('lays a month out in Saturday-first weeks', () => {
    // 1 Oct 2026 is a Thursday: five blanks (Sat–Wed) before it.
    const weeks = monthGrid('2026-10-19');
    expect(weeks[0]).toEqual([null, null, null, null, null, '2026-10-01', '2026-10-02']);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });

  it('moves between months across a year end', () => {
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-01');
    expect(addMonths('2026-01-31', -1)).toBe('2025-12-01');
  });

  it('keeps dates inside the allowed range', () => {
    expect(inRange('2026-10-19', '2026-10-19')).toBe(true);
    expect(inRange('2026-10-18', '2026-10-19')).toBe(false);
    expect(inRange('2026-10-20', undefined, '2026-10-19')).toBe(false);
  });

  it('opens on the picked date, else today, else the nearest allowed month', () => {
    expect(startMonth('2026-03-09', '2026-10-19')).toBe('2026-03-01');
    expect(startMonth('', '2026-10-19')).toBe('2026-10-01');
    // A birth date: today is past the latest allowed date, so it opens on that.
    expect(startMonth('', '2026-10-19', addYears('2026-10-19', -100), addYears('2026-10-19', -16))).toBe('2010-10-01');
  });

  it('keeps a 29 February age limit inside February', () => {
    expect(addYears('2028-02-29', -18)).toBe('2010-02-28');
    expect(addYears('2026-10-19', -18)).toBe('2008-10-19');
  });

  it('pulls a jumped-to month back inside the range', () => {
    expect(clampMonth('2030-05-01', '2026-10-19')).toBe('2030-05-01');
    expect(clampMonth('2025-05-01', '2026-10-19')).toBe('2026-10-01');
    expect(clampMonth('2012-05-01', undefined, '2010-10-19')).toBe('2010-10-01');
  });
});
