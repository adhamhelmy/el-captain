import { describe, expect, it } from 'vitest';
import { privateBody, privateDraftOf, privateDraftOk } from './PrivateSessionSettings';

describe('private session drafts', () => {
  it('starts switched on only when both are saved', () => {
    expect(privateDraftOf(800, 60)).toEqual({ on: true, price: '800', duration: '60' });
    expect(privateDraftOf(null, null)).toEqual({ on: false, price: '', duration: '' });
  });

  it('can always be saved off; on needs a valid price and length', () => {
    expect(privateDraftOk({ on: false, price: '600', duration: '' })).toBe(true);
    expect(privateDraftOk({ on: true, price: '600', duration: '60' })).toBe(true);
    expect(privateDraftOk({ on: true, price: '', duration: '' })).toBe(false);
    expect(privateDraftOk({ on: true, price: '600', duration: '' })).toBe(false);
    expect(privateDraftOk({ on: true, price: '600', duration: '5' })).toBe(false);
  });

  it('clears both when switched off, whatever was typed', () => {
    expect(privateBody({ on: false, price: '600', duration: '60' })).toEqual({ privatePrice: null, privateDuration: null });
    expect(privateBody({ on: true, price: '600', duration: '60' })).toEqual({ privatePrice: 600, privateDuration: 60 });
  });
});
