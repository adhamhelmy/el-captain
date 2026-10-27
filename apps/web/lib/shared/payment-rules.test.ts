import { describe, expect, it } from 'vitest';
import { offeredMethods, readPaymentMethod } from './payment-rules';

describe('readPaymentMethod', () => {
  it('treats no method as card, for older app versions', () => {
    expect(readPaymentMethod(undefined)).toBe('card');
    expect(readPaymentMethod(null)).toBe('card');
  });

  it.each(['card', 'cash'])('accepts %s', (m) => {
    expect(readPaymentMethod(m)).toBe(m);
  });

  it.each(['instapay', 'paypal', '', 3])('rejects %s', (m) => {
    expect(readPaymentMethod(m)).toBeNull();
  });
});

describe('offeredMethods', () => {
  it('offers nothing for a free session', () => {
    expect(offeredMethods(0)).toEqual([]);
  });

  it('offers card or cash for a paid one', () => {
    expect(offeredMethods(200)).toEqual(['card', 'cash']);
  });
});
