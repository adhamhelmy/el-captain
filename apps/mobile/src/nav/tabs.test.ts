import { ar, en } from '@el-captain/messages';
import { barFor, TABS } from './tabs';

const lookup = (messages: object, key: string) => key.split('.').reduce<any>((o, k) => o?.[k], messages);

describe('TABS', () => {
  it('matches the web nav for each audience, in order (a member reaches My sessions from home, a coach Locations from their profile)', () => {
    expect(TABS.user.map((t) => t.name)).toEqual(['dashboard', 'explore', 'coaches', 'profile']);
    expect(TABS.coach.map((t) => t.name)).toEqual(['dashboard', 'sessions', 'clients', 'profile']);
    expect(TABS.guest.map((t) => t.name)).toEqual(['explore', 'sign-in']);
  });

  it('labels every tab with a string that exists in both languages', () => {
    for (const tab of Object.values(TABS).flat()) {
      expect(typeof lookup(en, tab.labelKey)).toBe('string');
      expect(typeof lookup(ar, tab.labelKey)).toBe('string');
    }
  });
});

describe('barFor', () => {
  it('keeps the bar on detail pages, with no tab lit', () => {
    expect(barFor('/session/abc', '/user/dashboard')).toEqual({ audience: 'user', active: null });
    expect(barFor('/client/abc', '/coach/dashboard')).toEqual({ audience: 'coach', active: null });
    expect(barFor('/coach-profile/abc', '/guest/explore')).toEqual({ audience: 'guest', active: null });
  });

  it('keeps the guest bar on sign-up and password reset, lighting Log in', () => {
    expect(barFor('/register', '/guest/explore')).toEqual({ audience: 'guest', active: 'sign-in' });
  });

  it('shows none during onboarding or inside the tab groups, which draw their own', () => {
    expect(barFor('/session/abc', '/onboarding')).toBeNull();
    expect(barFor('/user/sessions', '/user/dashboard')).toBeNull();
  });
});
