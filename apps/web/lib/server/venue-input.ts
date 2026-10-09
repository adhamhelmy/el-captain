import { assertValid } from '@/lib/server/api';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { cleanText, venueProblems } from '@/lib/shared/session-rules';
import type { VenueData } from '@/prisma/models/venue';

/** The venue fields from a request body, trimmed and checked. 400 invalid_venue lists what's wrong. */
export function readVenue(body: unknown): VenueData {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const draft = { name: cleanText(b.name), address: cleanText(b.address), city: cleanText(b.city), mapUrl: cleanText(b.mapUrl) };
  const fields = venueProblems(draft);
  assertValid(fields.length === 0, 'Invalid venue', ERROR_CODES.INVALID_VENUE, { fields });
  return { ...draft, mapUrl: draft.mapUrl || null };
}
