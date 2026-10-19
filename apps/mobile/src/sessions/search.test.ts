import { exploreQuery, sportHits } from './search';

const sports = [
  { id: 'y', nameEn: 'Yoga', nameAr: 'يوجا', status: 'APPROVED' },
  { id: 'b', nameEn: 'Boxing', nameAr: 'ملاكمة', status: 'APPROVED' },
];

describe('exploreQuery', () => {
  it('builds the same query the web sends', () => {
    expect(exploreQuery({ sport: 'all', q: '' })).toBe('limit=50');
    expect(exploreQuery({ sport: 'y', q: 'sun rise' })).toBe('limit=50&sport=y&q=sun+rise');
  });
});

describe('sportHits', () => {
  it('matches sport names in either language, skipping the one already picked', () => {
    expect(sportHits(sports, 'yo', 'all').map((s) => s.id)).toEqual(['y']);
    expect(sportHits(sports, 'ملا', 'all').map((s) => s.id)).toEqual(['b']);
    expect(sportHits(sports, 'yo', 'y')).toEqual([]);
    expect(sportHits(sports, '', 'all')).toEqual([]);
  });
});
