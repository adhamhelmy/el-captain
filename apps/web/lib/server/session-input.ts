import { assertFound, assertValid } from '@/lib/server/api';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { cleanText, sessionProblems, type SessionDraft, type SessionField } from '@/lib/shared/session-rules';
import { findCoach } from '@/prisma/models/coach-profile';
import type { SessionWithDetails } from '@/prisma/models/session';

/** A blank draft: every required field fails until the body supplies it. */
export const EMPTY_DRAFT: SessionDraft = {
  title: '',
  description: '',
  sportId: '',
  venueId: '',
  level: 'ALL_LEVELS',
  startsAt: null,
  durationMin: Number.NaN,
  price: Number.NaN,
  capacity: Number.NaN,
  repeatWeeks: 1,
};

/** The saved session as a draft, so an edit only has to send what changes. */
export const draftFromSession = (s: SessionWithDetails): SessionDraft => ({
  title: s.title,
  description: s.description ?? '',
  sportId: s.sportId,
  venueId: s.venueId,
  level: s.level ?? 'ALL_LEVELS',
  startsAt: s.startsAt,
  durationMin: s.durationMin,
  price: s.price,
  capacity: s.capacity,
  repeatWeeks: 1,
});

const toNumber = (v: unknown) => {
  if (typeof v === 'number') return v;
  return typeof v === 'string' && v.trim() !== '' ? Number(v) : Number.NaN;
};
const toDate = (v: unknown) => {
  const d = typeof v === 'string' ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};

/** The body's fields laid over `base`. Fields the body leaves out keep their base value. */
export function readSessionDraft(body: unknown, base: SessionDraft): SessionDraft {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const has = (k: string) => b[k] !== undefined;
  return {
    title: has('title') ? cleanText(b.title) : base.title,
    description: has('description') ? cleanText(b.description) : base.description,
    sportId: has('sportId') ? cleanText(b.sportId) : base.sportId,
    venueId: has('venueId') ? cleanText(b.venueId) : base.venueId,
    level: has('level') ? cleanText(b.level) : base.level,
    startsAt: has('startsAt') ? toDate(b.startsAt) : base.startsAt,
    durationMin: has('durationMin') ? toNumber(b.durationMin) : base.durationMin,
    price: has('price') ? toNumber(b.price) : base.price,
    capacity: has('capacity') ? toNumber(b.capacity) : base.capacity,
    repeatWeeks: has('repeatWeeks') ? toNumber(b.repeatWeeks) : base.repeatWeeks,
  };
}

const invalid = (fields: SessionField[]) => assertValid(fields.length === 0, 'Invalid session', ERROR_CODES.INVALID_SESSION, { fields });

/** 400 invalid_session listing the fields that break a rule. */
export const assertSessionValid = (d: SessionDraft, now = new Date()) => invalid(sessionProblems(d, now));

/** The sport must be one of the coach's approved sports and the venue one of their active venues. Only the given ids are checked. */
export async function assertCoachCanUse(coachId: string, { sportId, venueId }: { sportId?: string; venueId?: string }) {
  const coach = await findCoach(coachId);
  assertFound(coach?.coachProfile);
  const fields: SessionField[] = [];
  if (sportId !== undefined && !coach.coachProfile.sports.some((s) => s.sportId === sportId && s.sport.status === 'APPROVED')) fields.push('sportId');
  if (venueId !== undefined && !coach.venues.some((v) => v.id === venueId)) fields.push('venueId');
  invalid(fields);
}
