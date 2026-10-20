import type { CoachVenue, Onboarding, Sport } from '@/api/types';
import { load, peek } from '@/api/cache';
import { PATHS } from '@/api/paths';

/** The coach's approved sports, from their own profile: the ones they can publish sessions in. */
const approved = (r: Onboarding) => r.coach.sports.filter((s: Sport) => s.status === 'APPROVED');
export const approvedSports = () =>
  load<Onboarding>(PATHS.onboarding)
    .then(approved)
    .catch(() => [] as Sport[]);

/** The coach's locations; `active` leaves out archived ones, as the session form lists them. */
const pick = (list: CoachVenue[], active: boolean) => (active ? list.filter((v) => !v.archived) : list);
export const myVenues = ({ active = false } = {}) =>
  load<CoachVenue[]>(PATHS.myVenues)
    .then((list) => pick(list, active))
    .catch(() => [] as CoachVenue[]);

/** What the last load (or sign-in) left, so a tab opens filled in; null when nothing is cached yet. */
export const cachedSports = () => {
  const r = peek<Onboarding>(PATHS.onboarding);
  return r ? approved(r) : null;
};
export const cachedVenues = ({ active = false } = {}) => {
  const list = peek<CoachVenue[]>(PATHS.myVenues);
  return list ? pick(list, active) : null;
};
