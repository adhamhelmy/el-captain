import { describe, expect, it } from 'vitest';
import { ageOn, birthDateOk, dateOnly } from './profile-rules';

const today = new Date('2026-10-15T12:00:00Z');

describe('ageOn', () => {
  it('counts a year only once the birthday has come', () => {
    expect(ageOn('1996-10-15', today)).toBe(30);
    expect(ageOn('1996-10-16', today)).toBe(29);
    expect(ageOn('1996-03-01', today)).toBe(30);
  });
});

describe('birthDateOk', () => {
  it('takes a real date within the age range', () => {
    expect(birthDateOk('1996-10-15', today)).toBe(true);
    expect(birthDateOk('2021-10-15', today)).toBe(true);
  });

  it.each(['1996-02-30', '1996-1-5', '15/10/1996', '', '2022-01-01', '1925-01-01'])('refuses %j', (value) => {
    expect(birthDateOk(value, today)).toBe(false);
  });
});

describe('dateOnly', () => {
  it('writes a stored date as YYYY-MM-DD, and keeps null', () => {
    expect(dateOnly(new Date('1996-10-15T00:00:00Z'))).toBe('1996-10-15');
    expect(dateOnly(null)).toBeNull();
  });
});
