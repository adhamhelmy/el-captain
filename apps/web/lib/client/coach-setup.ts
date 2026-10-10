/** The dashboard's "a few things left" card: what a newly approved coach still has to set up. */

export type SetupKey = 'approved' | 'location' | 'session' | 'pricing';
export type SetupStep = { key: SetupKey; done: boolean; href: string | null };

/** localStorage key that remembers this coach hid the card; per coach, so a shared browser doesn't hide it for others. */
export const setupHiddenKey = (coachId: string) => `coach-setup-hidden:${coachId}`;

/** Each step's state, worked out from data the dashboard already loads. */
export function setupSteps(d: {
  venueCount: number;
  sessionCount: number;
  privatePrice: number | null;
  privateDuration: number | null;
}): SetupStep[] {
  return [
    { key: 'approved', done: true, href: null },
    { key: 'location', done: d.venueCount > 0, href: '/coach/venues' },
    { key: 'session', done: d.sessionCount > 0, href: '/coach/sessions/me?add=1' },
    { key: 'pricing', done: d.privatePrice !== null && d.privateDuration !== null, href: '/coach/profile#private' },
  ];
}
