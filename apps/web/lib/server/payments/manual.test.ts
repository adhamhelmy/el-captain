import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/blob', () => ({ blobUrlOrNull: (p: string | null) => p }));
vi.mock('@/prisma/models/payment', () => ({ latestPayment: vi.fn() }));

import { HttpError } from '@/lib/server/api';
import { assertBooked, bookingPayment } from './manual';
import { latestPayment } from '@/prisma/models/payment';

beforeEach(() => vi.clearAllMocks());

describe('bookingPayment', () => {
  it('is null when nothing was paid', async () => {
    vi.mocked(latestPayment).mockResolvedValue(null);
    expect(await bookingPayment('b1')).toBeNull();
  });

  it('names a payment by its method', async () => {
    vi.mocked(latestPayment).mockResolvedValue({ id: 'p1', provider: 'CASH', status: 'PENDING', amountCents: 35000 });
    expect(await bookingPayment('b1')).toEqual({ method: 'cash', status: 'PENDING', amount: 350 });
  });
});

describe('assertBooked', () => {
  it('lets a booking through', () => {
    expect(() => assertBooked({ ok: true } as any)).not.toThrow();
  });

  it('answers a missing session with not found', () => {
    expect(() => assertBooked({ ok: false, reason: 'missing' })).toThrow(HttpError);
  });

  it.each([
    ['full', 'session_full'],
    ['cashLimit', 'cash_limit'],
  ] as const)('answers %s with %s', (reason, code) => {
    expect(() => assertBooked({ ok: false, reason })).toThrow(expect.objectContaining({ code }));
  });
});
