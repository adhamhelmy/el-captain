import { describe, expect, it, vi } from 'vitest';

vi.mock('@/prisma/models/coach-profile', () => ({ findCoachStatus: vi.fn() }));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ authOptions: {} }));

import { findCoachStatus } from '@/prisma/models/coach-profile';
import { assertActiveCoach } from './coach-guard';

describe('assertActiveCoach', () => {
  it('lets active coaches and other roles through', async () => {
    vi.mocked(findCoachStatus).mockResolvedValue('ACTIVE');
    await expect(assertActiveCoach({ id: 'k1', role: 'COACH' } as any)).resolves.toBeUndefined();
    await expect(assertActiveCoach({ id: 's1', role: 'STUDIO' } as any)).resolves.toBeUndefined();
  });

  it.each(['INCOMPLETE', 'PENDING', 'REJECTED', 'SUSPENDED', null])('stops a %s coach', async (status) => {
    vi.mocked(findCoachStatus).mockResolvedValue(status as any);
    await expect(assertActiveCoach({ id: 'k1', role: 'COACH' } as any)).rejects.toMatchObject({ status: 403, code: 'coach_not_active' });
  });
});
