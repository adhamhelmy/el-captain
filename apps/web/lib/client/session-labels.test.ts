import { createFormatter, createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { formats } from '@/i18n/formats';
import { APP_TZ, INTL_LOCALE, type AppLocale } from '@/i18n/locale';
import { MESSAGES } from '@/i18n/messages';
import { buildSessionLabels } from './session-labels';

const make = (lang: AppLocale) =>
  buildSessionLabels(
    createTranslator({ locale: INTL_LOCALE[lang], messages: MESSAGES[lang], namespace: 'data' }),
    createFormatter({ locale: INTL_LOCALE[lang], timeZone: APP_TZ, formats }),
    lang,
  );
const en = make('en');
const ar = make('ar');

const now = new Date('2026-10-20T10:00:00Z');
const s = {
  type: 'GROUP' as const,
  title: 'Sunrise Flow',
  startsAt: '2026-10-22T16:00:00.000Z', // Thu 19:00 Cairo, as JSON delivers it
  capacity: 16,
  booked: 12,
  sport: { id: 's1', nameEn: 'Yoga', nameAr: 'يوجا', status: 'APPROVED' as const },
};

describe('session labels (en)', () => {
  it('formats a start in Cairo time', () => expect(en.when(s.startsAt)).toMatch(/^Thu · Oct 22 · 7:00\sPM$/));
  it('counts spots, attendance and private sessions', () => {
    expect(en.spots(s, now)).toBe('4 spots left');
    expect(en.spots({ ...s, booked: 16 }, now)).toBe('Full');
    expect(en.spots({ ...s, startsAt: '2026-10-19T10:00:00Z' }, now)).toBe('12 attended');
    expect(en.spots({ ...s, type: 'PRIVATE' }, now)).toBe('One to one session');
  });
  it('names private sessions by their sport', () => {
    expect(en.title(s)).toBe('Sunrise Flow');
    expect(en.title({ ...s, type: 'PRIVATE' })).toBe('One to one · Yoga');
  });
  it('labels levels, types, sports, money and fill', () => {
    expect(en.level('ADVANCED')).toBe('Advanced');
    expect(en.type('GROUP')).toBe('Group');
    expect(en.sport(s.sport)).toBe('Yoga');
    expect(en.price(350)).toMatch(/^EGP\s350$/);
    expect(en.fill(s)).toBe('12/16');
  });
});

describe('session labels (ar)', () => {
  it('uses Arabic words, Arabic sport names and Western digits', () => {
    expect(ar.when(s.startsAt)).toMatch(/أكتوبر/);
    expect(ar.when(s.startsAt)).not.toMatch(/[٠-٩]/);
    expect(ar.sport(s.sport)).toBe('يوجا');
    expect(ar.title({ ...s, type: 'PRIVATE' })).toBe('تمرين فردي · يوجا');
    expect(ar.spots({ ...s, booked: 15 }, now)).toBe('مكان واحد فاضل');
  });
});
