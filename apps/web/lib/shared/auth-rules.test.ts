import { describe, it, expect } from 'vitest';
import { isStrongPassword, isValidEmail, normalizeEmail } from './auth-rules';

describe('isStrongPassword', () => {
  it('needs at least 8 characters', () => {
    expect(isStrongPassword('Abcdef1')).toBe(false);
    expect(isStrongPassword('Abcdefg1')).toBe(true);
  });
  it('needs a lowercase letter, an uppercase letter and a number', () => {
    expect(isStrongPassword('abcdefg1')).toBe(false);
    expect(isStrongPassword('ABCDEFG1')).toBe(false);
    expect(isStrongPassword('Abcdefgh')).toBe(false);
  });
  it('accepts fully Arabic passwords, with no English letters or digits', () => {
    expect(isStrongPassword('كلمةسرية١٢٣')).toBe(true);
    expect(isStrongPassword('كلمةسرية123')).toBe(true);
  });
  it('still needs a letter and a number in Arabic', () => {
    expect(isStrongPassword('كلمةسريةجدا')).toBe(false);
    expect(isStrongPassword('١٢٣٤٥٦٧٨')).toBe(false);
  });
  it('allows at most 72 bytes', () => {
    expect(isStrongPassword('Aa1' + 'x'.repeat(69))).toBe(true);
    expect(isStrongPassword('Aa1' + 'x'.repeat(70))).toBe(false);
    // Arabic letters take 2 bytes each.
    expect(isStrongPassword('Aa1' + 'ب'.repeat(35))).toBe(false);
  });
  it('rejects non-strings', () => {
    expect(isStrongPassword(undefined)).toBe(false);
    expect(isStrongPassword(12345678)).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts normal addresses', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('first.last+tag@mail.example.com')).toBe(true);
  });
  it('rejects broken addresses', () => {
    for (const email of ['', 'a', 'a@b', '@b.com', 'a@.com', 'a@b.', 'a@b..com', 'a b@c.com', 'a@b@c.com']) {
      expect(isValidEmail(email)).toBe(false);
    }
  });
  it('rejects addresses longer than 254 characters', () => {
    expect(isValidEmail(`${'a'.repeat(246)}@test.com`)).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => expect(normalizeEmail('  Foo@X.com ')).toBe('foo@x.com'));
  it('returns empty for non-strings', () => expect(normalizeEmail(null)).toBe(''));
});
