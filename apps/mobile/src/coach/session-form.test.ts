import { sessionProblems } from '@el-captain/rules/session-rules';
import type { Session, Sport, Venue } from '@/api/types';
import { blankDraft, clientSummary, clockText, draftOf, fillLabel, startInstant, timeWithPeriod, toSessionDraft, withOwn } from './session-form';

const sport: Sport = { id: 's1', nameEn: 'Yoga', nameAr: null, status: 'APPROVED' };
const venue: Venue = { id: 'v1', name: 'Studio', address: '1 St', city: 'Cairo', mapUrl: null, archived: false };
// 18:30 in Cairo (UTC+3 in October 2026 summer time ends Oct 30).
const session = {
  id: 'x1',
  type: 'GROUP',
  level: 'BEGINNER',
  title: 'Flow',
  description: null,
  coverUrl: null,
  startsAt: '2026-10-25T15:30:00.000Z',
  durationMin: 45,
  price: 300,
  capacity: 10,
  booked: 0,
  status: 'SCHEDULED',
  cancelReason: null,
  seriesId: null,
  sport,
  venue,
  coach: { id: 'k1', name: 'Mona', photoUrl: null },
} as Session;
const now = new Date('2026-10-19T09:00:00.000Z');

describe('blankDraft', () => {
  it('starts with the first sport and venue, 60 minutes, 12 spots, once', () => {
    expect(blankDraft([sport], [venue])).toMatchObject({ sportId: 's1', venueId: 'v1', level: 'ALL_LEVELS', duration: '60', capacity: '12', repeat: '1', date: '', time: '' });
  });
});

describe('draftOf', () => {
  it('fills the form from a session in Cairo time', () => {
    expect(draftOf(session)).toMatchObject({ title: 'Flow', description: '', level: 'BEGINNER', date: '2026-10-25', time: '18:30', duration: '45', price: '300', capacity: '10' });
  });
});

describe('toSessionDraft', () => {
  it('reads typed dates, times and numbers, Arabic digits included', () => {
    const d = toSessionDraft({ ...blankDraft([sport], [venue]), title: 'Run', date: '٢٠٢٦-١٠-٢٥', time: '6:30', price: '٢٥٠', capacity: '8' });
    expect(d.startsAt?.toISOString()).toBe('2026-10-25T03:30:00.000Z');
    expect(d).toMatchObject({ price: 250, capacity: 8, durationMin: 60, repeatWeeks: 1 });
    expect(sessionProblems(d, now)).toEqual([]);
  });

  it('flags an unreadable time and empty numbers', () => {
    const d = toSessionDraft({ ...blankDraft([sport], [venue]), title: 'Run', date: '25/10/2026', time: '18:00', price: '' });
    expect(d.startsAt).toBeNull();
    expect(sessionProblems(d, now)).toEqual(['startsAt', 'price']);
  });
});

describe('startInstant', () => {
  it('keeps the exact instant when the date and time are untouched', () => {
    expect(startInstant(session, draftOf(session), new Date('2026-10-25T16:30:00.000Z'))).toBe(session.startsAt);
  });
  it('uses the new time once changed', () => {
    const picked = new Date('2026-10-26T15:30:00.000Z');
    expect(startInstant(session, { ...draftOf(session), date: '2026-10-26' }, picked)).toBe(picked.toISOString());
    expect(startInstant(undefined, draftOf(session), picked)).toBe(picked.toISOString());
  });
});

describe('withOwn', () => {
  it("adds the edited session's own item when the list lacks it", () => {
    const archived = { ...venue, id: 'v9', archived: true };
    expect(withOwn([venue], archived).map((v) => v.id)).toEqual(['v1', 'v9']);
    expect(withOwn([venue], venue)).toHaveLength(1);
    expect(withOwn([venue])).toHaveLength(1);
  });
});

describe('fillLabel', () => {
  const l = { oneToOne: () => '1:1', fill: (s: { booked: number; capacity: number }) => `${s.booked}/${s.capacity}` };
  it('shows 1:1 for private, full when full, otherwise booked of capacity, and a dash once cancelled', () => {
    expect(fillLabel({ ...session, type: 'PRIVATE' }, l, 'Full')).toBe('1:1');
    expect(fillLabel({ ...session, booked: 10 }, l, 'Full')).toBe('Full');
    expect(fillLabel({ ...session, booked: 3 }, l, 'Full')).toBe('3/10');
    expect(fillLabel({ ...session, status: 'CANCELLED' }, l, 'Full')).toBe('—');
  });
});

describe('clientSummary', () => {
  it('counts attended and upcoming held sessions, money spent on attended ones, and the first one', () => {
    const at = (iso: string, extra: Partial<Session> = {}) => ({ ...session, id: iso, startsAt: iso, ...extra });
    // Newest first, as the API returns them.
    const list = [
      at('2026-10-30T15:00:00.000Z'),
      at('2026-10-10T15:00:00.000Z', { status: 'CANCELLED' }),
      at('2026-10-05T15:00:00.000Z', { price: 200 }),
      at('2026-09-01T15:00:00.000Z'),
    ];
    expect(clientSummary(list, now)).toEqual({ attended: 2, upcoming: 1, spent: 500, first: list[3] });
  });
});

describe('timeWithPeriod / clockText', () => {
  it('reads a 12-hour time with the AM/PM choice, and 24-hour times as typed', () => {
    expect(timeWithPeriod('6:30', 'PM')).toBe('18:30');
    expect(timeWithPeriod('٦:٣٠', 'AM')).toBe('06:30');
    expect(timeWithPeriod('12:00', 'AM')).toBe('00:00');
    expect(timeWithPeriod('18:15', 'AM')).toBe('18:15');
    expect(timeWithPeriod('0:45', 'PM')).toBe('00:45');
    expect(timeWithPeriod('6.30', 'PM')).toBeNull();
  });
  it('shows a saved time as the 12-hour text and its period', () => {
    expect(clockText('18:30')).toEqual({ text: '6:30', period: 'PM' });
    expect(clockText('00:05')).toEqual({ text: '12:05', period: 'AM' });
  });
});
