import { requestProblems } from './request';

const now = new Date('2026-10-20T10:00:00Z');
const ok = { venueId: 'v', sportId: 's', date: '2026-10-25', time: '18:00', message: '' };

describe('requestProblems', () => {
  it('passes a complete request in the future', () => {
    expect(requestProblems(ok, now)).toEqual([]);
  });

  it('flags a missing place or sport, a past or unreadable time, and a long message', () => {
    expect(requestProblems({ venueId: '', sportId: '', date: '2026-10-19', time: '18:00', message: 'x'.repeat(1001) }, now)).toEqual([
      'venueId',
      'sportId',
      'startsAt',
      'message',
    ]);
    expect(requestProblems({ ...ok, time: '25:99' }, now)).toEqual(['startsAtFormat']);
  });

  it('accepts a date and time typed with Arabic digits', () => {
    expect(requestProblems({ ...ok, date: '٢٠٢٦-١٠-٢٥', time: '٦:٠٠' }, now)).toEqual([]);
  });
});
