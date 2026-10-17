import { assertValid } from '@/lib/server/api';
import { MEDIA_CAPTION_MAX } from '@/lib/shared/coach-rules';
import { ERROR_CODES } from '@/lib/shared/error-codes';

/** Longest video length kept, in seconds; anything larger is treated as unknown. */
const MAX_DURATION_SEC = 6 * 60 * 60;

/**
 * The caption and sport from a request body. An empty caption is null; the sport must be one of the coach's own.
 * 400 when either is wrong.
 */
export function readMediaDetails(body: { caption?: unknown; sportId?: unknown }, coachSportIds: string[]) {
  const caption = typeof body.caption === 'string' ? body.caption.trim() : '';
  assertValid(caption.length <= MEDIA_CAPTION_MAX, 'Caption too long', ERROR_CODES.INVALID_PROFILE, { fields: ['caption'] });
  const sportId = typeof body.sportId === 'string' && body.sportId ? body.sportId : null;
  assertValid(sportId === null || coachSportIds.includes(sportId), 'Unknown sport', ERROR_CODES.INVALID_PROFILE, { fields: ['sportId'] });
  return { caption: caption || null, sportId };
}

/** A video's length as the browser read it, or null when missing or implausible. */
export const readDuration = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_DURATION_SEC ? Math.round(v) : null);
