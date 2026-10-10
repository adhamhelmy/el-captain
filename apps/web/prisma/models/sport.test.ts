import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted above imports, so the fake transaction must be created with vi.hoisted.
const tx = vi.hoisted(() => ({
  coachSport: { findMany: vi.fn(), createMany: vi.fn() },
  favouriteSport: { findMany: vi.fn(), createMany: vi.fn() },
  session: { updateMany: vi.fn() },
  privateRequest: { updateMany: vi.fn() },
  sport: { delete: vi.fn() },
}));
vi.mock('../client', () => ({ prisma: { $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)) } }));

import { mergeSport } from './sport';

beforeEach(() => {
  vi.clearAllMocks();
  tx.coachSport.findMany.mockResolvedValue([]);
  tx.favouriteSport.findMany.mockResolvedValue([]);
});

describe('mergeSport', () => {
  it('moves sessions and private requests over before deleting, so their links never block the delete', async () => {
    await mergeSport('s1', 's2');
    expect(tx.session.updateMany).toHaveBeenCalledWith({ where: { sportId: 's1' }, data: { sportId: 's2' } });
    expect(tx.privateRequest.updateMany).toHaveBeenCalledWith({ where: { sportId: 's1' }, data: { sportId: 's2' } });
    expect(tx.sport.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    const deletedAt = tx.sport.delete.mock.invocationCallOrder[0];
    expect(tx.session.updateMany.mock.invocationCallOrder[0]).toBeLessThan(deletedAt);
    expect(tx.privateRequest.updateMany.mock.invocationCallOrder[0]).toBeLessThan(deletedAt);
  });
});
