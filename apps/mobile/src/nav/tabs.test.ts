import { ar, en } from '@el-captain/messages';
import { TABS } from './tabs';

const lookup = (messages: object, key: string) => key.split('.').reduce<any>((o, k) => o?.[k], messages);

describe('TABS', () => {
  it('matches the web nav for each audience, in order', () => {
    expect(TABS.user.map((t) => t.name)).toEqual(['dashboard', 'explore', 'sessions', 'coaches', 'profile']);
    expect(TABS.coach.map((t) => t.name)).toEqual(['dashboard', 'sessions', 'clients', 'venues', 'profile']);
    expect(TABS.guest.map((t) => t.name)).toEqual(['explore', 'sign-in']);
  });

  it('labels every tab with a string that exists in both languages', () => {
    for (const tab of Object.values(TABS).flat()) {
      expect(typeof lookup(en, tab.labelKey)).toBe('string');
      expect(typeof lookup(ar, tab.labelKey)).toBe('string');
    }
  });
});
