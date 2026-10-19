import { pickLocale } from './locale';

describe('pickLocale', () => {
  it('uses Arabic when it is the first app language on the device', () => {
    expect(pickLocale(['ar', 'en'])).toBe('ar');
  });

  it('falls back to English', () => {
    expect(pickLocale(['de', null])).toBe('en');
    expect(pickLocale([])).toBe('en');
  });
});

describe('pickLocale follows the device primary language', () => {
  it('uses English when Arabic is only a secondary language', () => {
    expect(pickLocale(['fr', 'ar'])).toBe('en');
  });
});

describe('pickLocale with a saved choice', () => {
  it('prefers the language the user picked in the app', () => {
    expect(pickLocale(['en'], 'ar')).toBe('ar');
    expect(pickLocale(['ar'], 'en')).toBe('en');
  });

  it('ignores a saved value that is not an app language', () => {
    expect(pickLocale(['ar'], 'fr')).toBe('ar');
    expect(pickLocale(['ar'], null)).toBe('ar');
  });
});
