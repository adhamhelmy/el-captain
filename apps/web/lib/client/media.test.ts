import { describe, expect, it } from 'vitest';
import { clockLength } from './media';

describe('clockLength', () => {
  it('prints minutes and seconds, adding hours only when needed', () => {
    expect(clockLength(0)).toBe('0:00');
    expect(clockLength(74.6)).toBe('1:15');
    expect(clockLength(3725)).toBe('1:02:05');
  });
});
