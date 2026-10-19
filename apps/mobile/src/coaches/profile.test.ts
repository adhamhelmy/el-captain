import { filterSports } from './profile';

const yoga = { id: 'y', nameEn: 'Yoga', nameAr: null, status: 'APPROVED' };
const box = { id: 'b', nameEn: 'Boxing', nameAr: null, status: 'APPROVED' };

describe('filterSports', () => {
  it('lists each sport that has sessions or media once, in first-seen order', () => {
    expect(filterSports([{ sport: yoga }, { sport: yoga }], [{ sport: box }, { sport: null }]).map((s) => s.id)).toEqual(['y', 'b']);
  });
});
