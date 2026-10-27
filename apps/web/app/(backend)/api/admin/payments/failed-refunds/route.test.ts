import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/server/bearer', () => ({ userFromBearer: vi.fn(async () => null) }));
vi.mock('@/prisma/models/payment', () => ({ failedRefunds: vi.fn() }));

import { GET } from './route';
import { failedRefunds } from '@/prisma/models/payment';
import { call, signInAs } from '@/test/api';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(failedRefunds).mockResolvedValue([
    {
      id: 'p1',
      amountCents: 35000,
      providerTransactionId: 't1',
      updatedAt: new Date('2026-10-22T10:00:00Z'),
      member: { name: 'Ali', email: 'u@x.com' },
      booking: { session: { id: 'x1', title: 'Spin' } },
    },
  ]);
});

describe('GET /api/admin/payments/failed-refunds', () => {
  it('lists refunds Paymob refused, in pounds, with the transaction to look up', async () => {
    signInAs('a1', 'ADMIN');
    expect(await (await call(GET)).json()).toEqual([
      {
        id: 'p1',
        amount: 350,
        transactionId: 't1',
        failedAt: '2026-10-22T10:00:00.000Z',
        member: { name: 'Ali', email: 'u@x.com' },
        session: { id: 'x1', title: 'Spin' },
      },
    ]);
  });

  it('is for admins only', async () => {
    signInAs('u1', 'USER');
    expect((await call(GET)).status).toBe(403);
  });
});
