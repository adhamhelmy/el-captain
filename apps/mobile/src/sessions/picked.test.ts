import { pickedForYou } from './picked';

const s = (id: string, sport: string) => ({ id, sport: { id: sport } });

describe('pickedForYou', () => {
  it('suggests three open sessions the member is not booked on, favourite sports first', () => {
    const open = [s('1', 'yoga'), s('2', 'box'), s('3', 'yoga'), s('4', 'spin'), s('5', 'box')];
    const booked = [s('3', 'yoga')];
    expect(pickedForYou(open, booked, ['box']).map((x) => x.id)).toEqual(['2', '5', '1']);
  });
});
