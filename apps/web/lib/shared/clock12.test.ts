import { describe, expect, it } from 'vitest';
import { to12, to24 } from './clock12';

describe('12-hour clock', () => {
  it('reads evening, morning, noon and midnight', () => {
    expect(to12('18:30')).toEqual({ hour: 6, minute: 30, period: 'PM' });
    expect(to12('07:05')).toEqual({ hour: 7, minute: 5, period: 'AM' });
    expect(to12('12:00')).toEqual({ hour: 12, minute: 0, period: 'PM' });
    expect(to12('00:15')).toEqual({ hour: 12, minute: 15, period: 'AM' });
  });
  it('rejects anything that is not HH:mm', () => {
    expect(to12('')).toBeNull();
    expect(to12('24:00')).toBeNull();
    expect(to12('7:30')).toBeNull();
  });
  it('round-trips every minute of the day', () => {
    for (let h = 0; h < 24; h++)
      for (let m = 0; m < 60; m++) {
        const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        expect(to24(to12(t)!)).toBe(t);
      }
  });
});
