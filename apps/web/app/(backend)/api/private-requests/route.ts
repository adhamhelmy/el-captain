import { NextResponse } from 'next/server';
import { assertFound, assertNoConflict, assertValid, protect, type AuthContext } from '@/lib/server/api';
import { toRequestDTO } from '@/lib/server/dto';
import { requestLocale } from '@/lib/email/mail';
import { sendPrivateRequested } from '@/lib/email/session-emails';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { cleanText, TEXT_MAX } from '@/lib/shared/session-rules';
import { findActiveCoach } from '@/prisma/models/coach-profile';
import { setMemberLocale } from '@/prisma/models/member';
import { createRequest, hasPendingRequest } from '@/prisma/models/private-request';

/** A member asks a coach for a private session. The price and length are the coach's at this moment. */
async function send({ req, user }: AuthContext) {
  const b = ((await req.json()) ?? {}) as Record<string, unknown>;
  const now = new Date();
  const coach = await findActiveCoach(cleanText(b.coachId));
  assertFound(coach?.coachProfile);

  const { privatePrice, privateDuration, locale, sports } = coach.coachProfile;
  assertNoConflict(privatePrice !== null && privateDuration !== null, 'No private sessions', ERROR_CODES.PRIVATE_UNAVAILABLE);

  const startsAt = typeof b.startsAt === 'string' ? new Date(b.startsAt) : null;
  const venueId = cleanText(b.venueId);
  const sportId = cleanText(b.sportId);
  const message = cleanText(b.message);
  const fields = [
    ...(!startsAt || Number.isNaN(startsAt.getTime()) || startsAt <= now ? ['startsAt'] : []),
    ...(coach.venues.some((v) => v.id === venueId) ? [] : ['venueId']),
    ...(sports.some((s) => s.sportId === sportId && s.sport.status === 'APPROVED') ? [] : ['sportId']),
    ...(message.length > TEXT_MAX ? ['message'] : []),
  ];
  assertValid(fields.length === 0, 'Invalid request', ERROR_CODES.INVALID_SESSION, { fields });
  assertNoConflict(!(await hasPendingRequest(user.id, coach.id, now)), 'Request pending', ERROR_CODES.PRIVATE_UNAVAILABLE);

  const request = await createRequest({
    memberId: user.id,
    coachId: coach.id,
    venueId,
    sportId,
    startsAt: startsAt!,
    durationMin: privateDuration!,
    price: privatePrice!,
    message: message || null,
  });
  await setMemberLocale(user.id, requestLocale(req));
  await sendPrivateRequested({ id: coach.id, email: coach.email, locale }, request);
  return NextResponse.json(toRequestDTO(request), { status: 201 });
}

export const POST = protect(send, ['USER']);
