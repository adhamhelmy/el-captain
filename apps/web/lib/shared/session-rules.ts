/**
 * Session, venue and private-request rules shared by the forms and the API. No server imports.
 * Limits here are the single source of truth.
 */
import { addWeeks } from '@/lib/shared/app-time';
import { isValidLinkUrl } from '@/lib/shared/coach-rules';

/** Members may cancel until this long before the start. */
export const CANCEL_CUTOFF_MS = 2 * 60 * 60 * 1000;
export const MAX_REPEAT_WEEKS = 12;
export const CAPACITY = { min: 2, max: 100 } as const;
export const DURATION = { min: 15, max: 240 } as const;
export const PRICE_MAX = 100_000;
export const TITLE_MAX = 80;
/** Description, request message, cancel reason and reject note. */
export const TEXT_MAX = 1000;
export const VENUE = { name: 80, address: 200, city: 80 } as const;

/** Matches the SessionLevel enum in the Prisma schema. */
/** Which side of now a session list shows. */
export const WHENS = ['upcoming', 'past'] as const;
export type When = (typeof WHENS)[number];

export const SESSION_LEVELS = ['ALL_LEVELS', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export type SessionLevel = (typeof SESSION_LEVELS)[number];
export const isSessionLevel = (v: unknown): v is SessionLevel => SESSION_LEVELS.includes(v as SessionLevel);

const ms = (d: Date | string) => new Date(d).getTime();

export const endsAt = (startsAt: Date | string, durationMin: number) => new Date(ms(startsAt) + durationMin * 60_000);
export const hasStarted = (startsAt: Date | string, now = new Date()) => ms(startsAt) <= now.getTime();
export const canMemberCancel = (startsAt: Date | string, now = new Date()) => ms(startsAt) - now.getTime() >= CANCEL_CUTOFF_MS;

type Slot = { startsAt: Date | string; durationMin: number };
/** Whether two sessions share any minute; one may start exactly when the other ends. */
export const overlaps = (a: Slot, b: Slot) =>
  ms(a.startsAt) < endsAt(b.startsAt, b.durationMin).getTime() && ms(b.startsAt) < endsAt(a.startsAt, a.durationMin).getTime();

/** The first start and the same Cairo time each following week. Null if a week lands on a time skipped by daylight saving. */
export function repeatStarts(first: Date, weeks: number): Date[] | null {
  const starts = Array.from({ length: weeks }, (_, i) => (i === 0 ? first : addWeeks(first, i)));
  return starts.every((d): d is Date => d !== null) ? starts : null;
}

/** A string trimmed, or '' when it isn't a string. */
export const cleanText = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

const intIn = (n: unknown, min: number, max: number) => Number.isInteger(n) && (n as number) >= min && (n as number) <= max;
const lengthIn = (s: string, min: number, max: number) => s.trim().length >= min && s.trim().length <= max;

/** A session as the form and the API hold it before saving. Numbers are already parsed; NaN fails the checks. */
export type SessionDraft = {
  title: string;
  description: string;
  sportId: string;
  venueId: string;
  level: string;
  startsAt: Date | null;
  durationMin: number;
  price: number;
  capacity: number;
  repeatWeeks: number;
};
export type SessionField = keyof SessionDraft;

/** The fields that break a rule, in form order. Empty means the draft can be saved. */
export function sessionProblems(d: SessionDraft, now = new Date()): SessionField[] {
  const checks: [SessionField, boolean][] = [
    ['title', lengthIn(d.title, 1, TITLE_MAX)],
    ['description', d.description.trim().length <= TEXT_MAX],
    ['sportId', d.sportId !== ''],
    ['venueId', d.venueId !== ''],
    ['level', isSessionLevel(d.level)],
    ['startsAt', !!d.startsAt && d.startsAt.getTime() > now.getTime()],
    ['durationMin', intIn(d.durationMin, DURATION.min, DURATION.max)],
    ['price', intIn(d.price, 0, PRICE_MAX)],
    ['capacity', intIn(d.capacity, CAPACITY.min, CAPACITY.max)],
    ['repeatWeeks', intIn(d.repeatWeeks, 1, MAX_REPEAT_WEEKS)],
  ];
  return checks.filter(([, ok]) => !ok).map(([field]) => field);
}

export type VenueDraft = { name: string; address: string; city: string; mapUrl: string };
export type VenueField = keyof VenueDraft;

export function venueProblems(v: VenueDraft): VenueField[] {
  const checks: [VenueField, boolean][] = [
    ['name', lengthIn(v.name, 1, VENUE.name)],
    ['address', lengthIn(v.address, 1, VENUE.address)],
    ['city', lengthIn(v.city, 1, VENUE.city)],
    ['mapUrl', v.mapUrl.trim() === '' || isValidLinkUrl(v.mapUrl.trim())],
  ];
  return checks.filter(([, ok]) => !ok).map(([field]) => field);
}

/** A coach's private-session price and length: both set (turns requests on) or both cleared. */
export const privateSettingsOk = (price: number | null, duration: number | null) =>
  (price === null && duration === null) || (intIn(price, 0, PRICE_MAX) && intIn(duration, DURATION.min, DURATION.max));

/** Matches the PrivateRequestStatus enum. EXPIRED is never stored: it's a pending request whose time has passed. */
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type RequestState = RequestStatus | 'EXPIRED';

export const requestState = (r: { status: RequestStatus; startsAt: Date | string }, now = new Date()): RequestState =>
  r.status === 'PENDING' && hasStarted(r.startsAt, now) ? 'EXPIRED' : r.status;

/** How a session reads on a page; also the status Tag kind. */
export function sessionPhase(s: { status: string; startsAt: Date | string }, now = new Date()) {
  if (s.status === 'CANCELLED') return 'cancelled';
  return hasStarted(s.startsAt, now) ? 'past' : 'upcoming';
}
