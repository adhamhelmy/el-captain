import type { CoachVenue, Onboarding, Sport } from '@/api/types';
import { api } from '@/api/client';

/** The coach's approved sports, from their own profile: the ones they can publish sessions in. */
export const approvedSports = () =>
  api<Onboarding>('/api/coaches/me/onboarding')
    .then((r) => r.coach.sports.filter((s: Sport) => s.status === 'APPROVED'))
    .catch(() => [] as Sport[]);

/** The coach's locations; `active` leaves out archived ones, as the session form lists them. */
export const myVenues = ({ active = false } = {}) =>
  api<CoachVenue[]>('/api/venues/me')
    .then((list) => (active ? list.filter((v) => !v.archived) : list))
    .catch(() => [] as CoachVenue[]);
