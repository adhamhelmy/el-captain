import { blobUrlOrNull } from '@/lib/blob';
import type { Draft } from '@/lib/coach-rules';
import type { Attendee, BookingWithClass } from '@/prisma/models/booking';
import type { ClassWithHost } from '@/prisma/models/class';
import type { Client } from '@/prisma/models/client-profile';
import type { Certification } from '@/prisma/models/certification';
import type { Coach } from '@/prisma/models/coach-profile';
import type { CoachStatusEvent } from '@/prisma/models/coach-status';
import type { SessionRequestWithPeople } from '@/prisma/models/session-request';
import type { Sport } from '@/prisma/models/sport';

// API response shapes. Each mapper keeps the record's own columns and only flattens its relations;
// dates need no mapping because NextResponse.json writes them as ISO strings.
// Relations holding a user record are always destructured out, so their password hash never leaks.

export const toClassDTO = ({ client, ...cls }: ClassWithHost) => ({
  ...cls,
  clientName: client.name,
  studioName: client.clientProfile?.studioName ?? null,
  isCoach: !!client.coachProfile,
});

export const toBookingDTO = ({ class: cls, ...booking }: BookingWithClass) => ({
  ...booking,
  class: toClassDTO(cls),
});

export const toAttendeeDTO = ({ id, createdAt, user }: Attendee) => ({
  bookingId: id,
  userId: user.id,
  name: user.name,
  email: user.email,
  bookedAt: createdAt,
});

export const toSessionRequestDTO = ({ user, coach, ...request }: SessionRequestWithPeople) => ({
  ...request,
  userName: user.name,
  userEmail: user.email,
  coachName: coach.name,
});

export const toSportDTO = ({ id, nameEn, nameAr, status }: Sport) => ({ id, nameEn, nameAr, status });
export type SportDTO = ReturnType<typeof toSportDTO>;

/** A certificate without its storage path; the file is only reachable through the owner/admin route. */
export const toCertificationDTO = ({ id, title, fileName, contentType, size, createdAt }: Certification) => ({
  id,
  title,
  fileName,
  contentType,
  size,
  createdAt,
});

/**
 * Storage paths never leave the server: the photo becomes a URL, certificates are fetched through their own route.
 * Fields are listed explicitly so new columns don't leak by accident.
 */
export const toCoachDTO = ({ id, name, coachProfile: p }: Coach) => ({
  id,
  userId: id,
  coachName: name,
  status: p!.status,
  submittedAt: p!.submittedAt,
  bio: p!.bio,
  city: p!.city,
  phone: p!.phone,
  instagram: p!.instagram,
  tiktok: p!.tiktok,
  photoUrl: blobUrlOrNull(p!.photoPath),
  links: p!.links.map(({ id, label, url }) => ({ id, label, url })),
  sports: p!.sports.map(({ sport }) => toSportDTO(sport)),
  certifications: p!.certifications.map(toCertificationDTO),
});

export type CoachDTO = ReturnType<typeof toCoachDTO>;

/** The parts of a profile the submit check looks at. */
export const draftOf = ({ coachProfile: p }: Coach): Draft => ({
  photoPath: p?.photoPath ?? null,
  bio: p?.bio ?? null,
  instagram: p?.instagram ?? null,
  tiktok: p?.tiktok ?? null,
  sportCount: p?.sports.length ?? 0,
});

export const toClientDTO = ({ id, name, clientProfile }: Client) => ({
  ...clientProfile,
  id,
  userId: id,
  clientName: name,
});

type StatusEvent = CoachStatusEvent & { actorName: string | null };

/** The admin's view of a coach: the public profile plus contact details and the review history. */
export const toAdminCoachDTO = (coach: Coach, events: StatusEvent[]) => ({
  ...toCoachDTO(coach),
  email: coach.email,
  locale: coach.coachProfile?.locale ?? null,
  history: events.map(({ id, from, to, reason, actorName, createdAt }) => ({ id, from, to, reason, actorName, createdAt })),
});

/** One row of the admin's coach list. */
export const toAdminCoachRowDTO = ({ id, name, email, createdAt, coachProfile: p }: Coach) => ({
  id,
  name,
  email,
  createdAt,
  status: p?.status ?? 'INCOMPLETE',
  submittedAt: p?.submittedAt ?? null,
  photoUrl: blobUrlOrNull(p?.photoPath),
  sports: (p?.sports ?? []).map(({ sport }) => toSportDTO(sport)),
});

export type AdminCoachDTO = ReturnType<typeof toAdminCoachDTO>;
export type AdminCoachRowDTO = ReturnType<typeof toAdminCoachRowDTO>;
