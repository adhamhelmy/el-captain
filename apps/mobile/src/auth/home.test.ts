import { afterSignIn, homeFor } from './home';

const user = (role: string, coachStatus?: string) => ({ id: 'u1', name: 'A', email: 'a@b.com', role, coachStatus }) as any;

describe('homeFor', () => {
  it('sends guests to Explore', () => {
    expect(homeFor(null)).toBe('/guest/explore');
  });

  it('sends members to their dashboard', () => {
    expect(homeFor(user('USER'))).toBe('/user/dashboard');
  });

  it('sends approved coaches (and studios) to the coach dashboard', () => {
    expect(homeFor(user('COACH', 'ACTIVE'))).toBe('/coach/dashboard');
    expect(homeFor(user('STUDIO'))).toBe('/coach/dashboard');
  });

  it('keeps coaches who are not approved in onboarding', () => {
    for (const status of ['INCOMPLETE', 'PENDING', 'REJECTED', 'SUSPENDED', undefined]) {
      expect(homeFor(user('COACH', status))).toBe('/onboarding');
    }
  });

  it('treats admins as guests (admin stays on the web)', () => {
    expect(homeFor(user('ADMIN'))).toBe('/guest/explore');
  });
});

describe('afterSignIn', () => {
  it('takes a member back to the page that sent them to log in', () => {
    expect(afterSignIn(user('USER'), '/session/s1')).toBe('/session/s1');
  });

  it('sends coaches to their own home, never to a member page', () => {
    expect(afterSignIn(user('COACH', 'INCOMPLETE'), '/session/s1')).toBe('/onboarding');
    expect(afterSignIn(user('COACH', 'ACTIVE'), '/coach-profile/k1')).toBe('/coach/dashboard');
  });

  it('goes home when there is nowhere to return to', () => {
    expect(afterSignIn(user('USER'), null)).toBe('/user/dashboard');
  });
});
