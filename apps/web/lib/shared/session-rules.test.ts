import { describe, expect, it } from 'vitest';
import { wallClock } from './app-time';
import {
  canMemberCancel,
  hasStarted,
  overlaps,
  privateSettingsOk,
  repeatStarts,
  requestState,
  sessionPhase,
  sessionProblems,
  venueProblems,
  type SessionDraft,
} from './session-rules';

const now = new Date('2026-10-20T10:00:00Z');
const hour = 60 * 60 * 1000;

const draft: SessionDraft = {
  title: 'Sunrise Flow',
  description: '',
  sportId: 's1',
  venueId: 'v1',
  level: 'ALL_LEVELS',
  startsAt: new Date('2026-10-21T05:00:00Z'),
  durationMin: 60,
  price: 350,
  capacity: 12,
  repeatWeeks: 1,
};

describe('canMemberCancel', () => {
  it('allows cancelling up to exactly 2 hours before start', () => {
    expect(canMemberCancel(new Date(now.getTime() + 2 * hour), now)).toBe(true);
    expect(canMemberCancel(new Date(now.getTime() + 2 * hour - 1), now)).toBe(false);
  });
});

describe('hasStarted', () => {
  it('counts the start minute as started', () => {
    expect(hasStarted(now, now)).toBe(true);
    expect(hasStarted(new Date(now.getTime() + 1), now)).toBe(false);
  });
});

describe('overlaps', () => {
  const a = { startsAt: new Date('2026-10-21T05:00:00Z'), durationMin: 60 };
  it('detects sessions sharing any minute', () => {
    expect(overlaps(a, { startsAt: new Date('2026-10-21T05:59:00Z'), durationMin: 30 })).toBe(true);
  });
  it('lets one session start when another ends', () => {
    expect(overlaps(a, { startsAt: new Date('2026-10-21T06:00:00Z'), durationMin: 30 })).toBe(false);
  });
});

describe('repeatStarts', () => {
  it('returns one start per week at the same Cairo time, across the end of summer time', () => {
    const starts = repeatStarts(new Date('2026-10-22T16:00:00Z'), 3)!;
    expect(starts.map((d) => wallClock(d))).toEqual([
      { date: '2026-10-22', time: '19:00' },
      { date: '2026-10-29', time: '19:00' },
      { date: '2026-11-05', time: '19:00' },
    ]);
  });
  it('returns just the first start for one week', () => {
    expect(repeatStarts(draft.startsAt!, 1)).toEqual([draft.startsAt]);
  });
});

describe('sessionProblems', () => {
  it('accepts a valid draft', () => expect(sessionProblems(draft, now)).toEqual([]));
  it('lists every field out of range', () => {
    const bad = {
      ...draft,
      title: ' ',
      level: 'PRO',
      startsAt: new Date(now.getTime() - 1),
      durationMin: 10,
      price: -1,
      capacity: 1,
      repeatWeeks: 13,
    };
    expect(sessionProblems(bad, now)).toEqual(['title', 'level', 'startsAt', 'durationMin', 'price', 'capacity', 'repeatWeeks']);
  });
  it('checks the limits at both edges', () => {
    expect(sessionProblems({ ...draft, title: 'x'.repeat(80), durationMin: 240, price: 100_000, capacity: 100, repeatWeeks: 12 }, now)).toEqual([]);
    expect(sessionProblems({ ...draft, title: 'x'.repeat(81), description: 'x'.repeat(1001) }, now)).toEqual(['title', 'description']);
  });
  it('needs a sport, a venue and a start', () => {
    expect(sessionProblems({ ...draft, sportId: '', venueId: '', startsAt: null }, now)).toEqual(['sportId', 'venueId', 'startsAt']);
  });
});

describe('venueProblems', () => {
  const venue = { name: 'Zamalek Club', address: '26 July St', city: 'Cairo', mapUrl: '' };
  it('accepts a venue with or without an https map link', () => {
    expect(venueProblems(venue)).toEqual([]);
    expect(venueProblems({ ...venue, mapUrl: 'https://maps.app.goo.gl/abc' })).toEqual([]);
  });
  it('rejects blanks, long fields and non-https links', () => {
    expect(venueProblems({ name: '', address: 'x'.repeat(201), city: ' ', mapUrl: 'http://maps.example.com' })).toEqual([
      'name',
      'address',
      'city',
      'mapUrl',
    ]);
  });
});

describe('privateSettingsOk', () => {
  it('needs both values or neither', () => {
    expect(privateSettingsOk(800, 60)).toBe(true);
    expect(privateSettingsOk(null, null)).toBe(true);
    expect(privateSettingsOk(800, null)).toBe(false);
    expect(privateSettingsOk(800, 10)).toBe(false);
    expect(privateSettingsOk(100_001, 60)).toBe(false);
  });
});

describe('requestState', () => {
  it('reports a pending request whose time has passed as expired', () => {
    expect(requestState({ status: 'PENDING', startsAt: new Date(now.getTime() - 1) }, now)).toBe('EXPIRED');
    expect(requestState({ status: 'PENDING', startsAt: new Date(now.getTime() + hour) }, now)).toBe('PENDING');
    expect(requestState({ status: 'REJECTED', startsAt: new Date(now.getTime() - 1) }, now)).toBe('REJECTED');
  });
});

describe('sessionPhase', () => {
  it('is cancelled, past or upcoming', () => {
    expect(sessionPhase({ status: 'CANCELLED', startsAt: new Date(now.getTime() + hour) }, now)).toBe('cancelled');
    expect(sessionPhase({ status: 'SCHEDULED', startsAt: now }, now)).toBe('past');
    expect(sessionPhase({ status: 'SCHEDULED', startsAt: new Date(now.getTime() + hour).toISOString() }, now)).toBe('upcoming');
  });
});
