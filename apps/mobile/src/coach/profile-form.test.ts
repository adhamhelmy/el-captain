import type { CoachMe } from '@/api/types';
import { profileBody, profileFormOf, profileSnapshot } from './profile-form';

const coach = {
  id: 'k1',
  coachName: 'Mona',
  birthDate: null,
  gender: 'FEMALE',
  languages: ['ar'],
  status: 'ACTIVE',
  submittedAt: null,
  bio: 'Boxing.',
  city: 'Zamalek, Cairo',
  phone: null,
  instagram: 'https://instagram.com/mona',
  tiktok: null,
  privatePrice: 600,
  privateDuration: 60,
  photoUrl: 'https://blob/p.jpg',
  coverUrl: null,
  links: [{ id: 'l1', label: 'Site', url: 'https://mona.fit' }],
  sports: [{ id: 's1', nameEn: 'Boxing', nameAr: null, status: 'APPROVED' }],
  certifications: [],
  media: [],
} as CoachMe;

describe('profileFormOf', () => {
  it('fills the form from the saved profile, social links as handles', () => {
    expect(profileFormOf(coach)).toMatchObject({
      name: 'Mona',
      city: 'Zamalek, Cairo',
      instagram: 'mona',
      tiktok: '',
      birthDate: '',
      gender: 'FEMALE',
      links: [{ key: 'l1', label: 'Site', url: 'https://mona.fit' }],
      photo: null,
      cover: null,
      private: { on: true, price: '600', duration: '60' },
    });
  });
});

describe('profileSnapshot', () => {
  it('ignores row keys and sport details, but sees real edits', () => {
    const f = profileFormOf(coach);
    const same = { ...f, links: [{ ...f.links[0], key: 'other' }], sports: [{ ...f.sports[0], nameEn: 'Boxe' }] };
    expect(profileSnapshot(same)).toBe(profileSnapshot(f));
    expect(profileSnapshot({ ...f, bio: 'Boxing!' })).not.toBe(profileSnapshot(f));
    expect(profileSnapshot({ ...f, cover: { path: 'coaches/k1/cover/c.jpg', url: 'file:///c.jpg' } })).not.toBe(profileSnapshot(f));
  });
});

describe('profileBody', () => {
  it('sends what the web sends, with new photo or cover paths only when uploaded', () => {
    const f = profileFormOf(coach);
    expect(profileBody(f)).toEqual({
      privatePrice: 600,
      privateDuration: 60,
      name: 'Mona',
      city: 'Zamalek, Cairo',
      bio: 'Boxing.',
      instagram: 'mona',
      tiktok: '',
      links: [{ label: 'Site', url: 'https://mona.fit' }],
      sportIds: ['s1'],
      birthDate: null,
      gender: 'FEMALE',
      languages: ['ar'],
    });
    expect(profileBody({ ...f, photo: { path: 'coaches/k1/photo/p.jpg', url: 'file:///p.jpg' }, private: { on: false, price: '600', duration: '60' } })).toMatchObject({
      photoPath: 'coaches/k1/photo/p.jpg',
      privatePrice: null,
      privateDuration: null,
    });
  });
});
