import { describe, expect, it } from 'vitest';
import {
  canTransition,
  cleanSportName,
  COACH_STATUSES,
  firstIncompleteStep,
  isCoachStatus,
  isValidLinkUrl,
  isValidSportName,
  missingFields,
  normalizeSocial,
  ownsUpload,
  sportKey,
  sportName,
  uploadPrefix,
} from './coach-rules';

describe('canTransition', () => {
  it('lets a coach submit and resubmit only', () => {
    expect(canTransition('INCOMPLETE', 'PENDING', 'coach')).toBe(true);
    expect(canTransition('REJECTED', 'PENDING', 'coach')).toBe(true);
    expect(canTransition('PENDING', 'ACTIVE', 'coach')).toBe(false);
    expect(canTransition('SUSPENDED', 'ACTIVE', 'coach')).toBe(false);
  });

  it('lets an admin approve, reject, suspend and reinstate', () => {
    expect(canTransition('PENDING', 'ACTIVE', 'admin')).toBe(true);
    expect(canTransition('PENDING', 'REJECTED', 'admin')).toBe(true);
    expect(canTransition('ACTIVE', 'SUSPENDED', 'admin')).toBe(true);
    expect(canTransition('SUSPENDED', 'ACTIVE', 'admin')).toBe(true);
  });

  it('refuses everything else', () => {
    expect(canTransition('INCOMPLETE', 'ACTIVE', 'admin')).toBe(false);
    expect(canTransition('REJECTED', 'ACTIVE', 'admin')).toBe(false);
    expect(canTransition('ACTIVE', 'REJECTED', 'admin')).toBe(false);
    expect(canTransition('ACTIVE', 'ACTIVE', 'admin')).toBe(false);
    expect(canTransition('INCOMPLETE', 'PENDING', 'admin')).toBe(false);
  });
});

describe('normalizeSocial', () => {
  it.each([
    ['@mona.fit', 'https://www.instagram.com/mona.fit'],
    ['mona_fit', 'https://www.instagram.com/mona_fit'],
    ['instagram.com/mona.fit/', 'https://www.instagram.com/mona.fit'],
    ['https://www.instagram.com/mona.fit?igsh=abc', 'https://www.instagram.com/mona.fit'],
    ['  @Mona.Fit  ', 'https://www.instagram.com/Mona.Fit'],
  ])('instagram %s', (input, out) => expect(normalizeSocial('instagram', input)).toBe(out));

  it.each([
    ['@mona', 'https://www.tiktok.com/@mona'],
    ['mona.fit', 'https://www.tiktok.com/@mona.fit'],
    ['https://www.tiktok.com/@mona?lang=en', 'https://www.tiktok.com/@mona'],
    ['tiktok.com/@mona/', 'https://www.tiktok.com/@mona'],
  ])('tiktok %s', (input, out) => expect(normalizeSocial('tiktok', input)).toBe(out));

  it.each(['', '   ', '@', 'https://evil.com/mona', 'https://www.tiktok.com/@mona', 'has space', 'a'.repeat(31)])(
    'rejects %j for instagram',
    (input) => expect(normalizeSocial('instagram', input)).toBeNull(),
  );

  it('rejects an instagram URL given as tiktok', () => {
    expect(normalizeSocial('tiktok', 'https://www.instagram.com/mona')).toBeNull();
  });
});

describe('isValidLinkUrl', () => {
  it('accepts https URLs with a real host', () => {
    expect(isValidLinkUrl('https://linkedin.com/in/mona')).toBe(true);
  });
  it.each(['http://linkedin.com', 'javascript:alert(1)', 'https://localhost', 'linkedin.com', ''])('rejects %j', (u) =>
    expect(isValidLinkUrl(u)).toBe(false),
  );
});

describe('sportKey', () => {
  it('ignores case and extra spaces', () => {
    expect(sportKey('  Kick  Boxing ')).toBe('kick boxing');
    expect(sportKey('kick boxing')).toBe('kick boxing');
  });
});

describe('sport names', () => {
  it('cleans and checks them', () => {
    expect(cleanSportName('  Kick   boxing ')).toBe('Kick boxing');
    expect(cleanSportName(42)).toBe('');
    expect(isValidSportName('x')).toBe(false);
    expect(isValidSportName('x'.repeat(41))).toBe(false);
    expect(isValidSportName('Padel')).toBe(true);
  });
});

describe('ownsUpload', () => {
  it('accepts paths under the coach’s own folder for that kind', () => {
    expect(uploadPrefix('u1', 'photo')).toBe('coaches/u1/photo/');
    expect(ownsUpload('u1', 'photo', 'coaches/u1/photo/me-x7Ab.jpg')).toBe(true);
    expect(ownsUpload('u1', 'certificate', 'coaches/u1/certs/cert-x7Ab.pdf')).toBe(true);
  });
  it.each([
    'coaches/u2/photo/me.jpg',
    'coaches/u1/certs/me.jpg',
    'coaches/u1/photo/../../u2/photo/me.jpg',
    'coaches/u10/photo/me.jpg',
    'coaches/u1/photo/',
  ])('rejects %j for u1 photo', (p) => expect(ownsUpload('u1', 'photo', p)).toBe(false));
  it('rejects non-strings', () => expect(ownsUpload('u1', 'photo', 42)).toBe(false));
});

describe('missingFields', () => {
  const full = { photoPath: 'p', bio: 'x'.repeat(50), instagram: 'i', tiktok: 't', sportCount: 1 };
  it('is empty for a complete draft', () => expect(missingFields(full)).toEqual([]));
  it('lists every missing piece in step order; socials are optional', () => {
    expect(missingFields({ photoPath: null, bio: null, instagram: null, tiktok: null, sportCount: 0 })).toEqual(['photo', 'bio', 'sports']);
  });
  it('accepts a bio of any length but not an empty or blank one', () => {
    expect(missingFields({ ...full, bio: 'Hi' })).toEqual([]);
    expect(missingFields({ ...full, bio: '   ' })).toEqual(['bio']);
    expect(missingFields({ ...full, bio: '' })).toEqual(['bio']);
  });
  it('flags more than 10 sports', () => expect(missingFields({ ...full, sportCount: 11 })).toEqual(['sports']));
});

describe('firstIncompleteStep', () => {
  it('opens the step of the first missing field, or the last step when done', () => {
    expect(firstIncompleteStep(['sports'])).toBe(3);
    expect(firstIncompleteStep(['bio', 'sports'])).toBe(1);
    expect(firstIncompleteStep([])).toBe(4);
  });
});

describe('sportName', () => {
  it('uses the Arabic name for any Arabic locale, falling back to English', () => {
    const yoga = { nameEn: 'Yoga', nameAr: 'يوجا' };
    expect(sportName(yoga, 'ar-EG-u-nu-latn')).toBe('يوجا');
    expect(sportName(yoga, 'en-US')).toBe('Yoga');
    expect(sportName({ nameEn: 'Padel', nameAr: null }, 'ar-EG-u-nu-latn')).toBe('Padel');
  });
});

describe('coach statuses', () => {
  it('lists every status and recognises only those', () => {
    expect(COACH_STATUSES).toEqual(['INCOMPLETE', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED']);
    expect(isCoachStatus('PENDING')).toBe(true);
    expect(isCoachStatus('pending')).toBe(false);
    expect(isCoachStatus(undefined)).toBe(false);
  });
});
