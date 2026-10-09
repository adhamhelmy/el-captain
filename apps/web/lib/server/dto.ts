import { blobUrlOrNull } from '@/lib/server/blob';
import type { Draft } from '@/lib/shared/coach-rules';
import type { Client } from '@/prisma/models/client-profile';
import type { Certification } from '@/prisma/models/certification';
import type { Coach } from '@/prisma/models/coach-profile';
import type { Member } from '@/prisma/models/member';
import type { CoachStatusEvent } from '@/prisma/models/coach-status';
import type { Sport } from '@/prisma/models/sport';
import type { Venue } from '@/prisma/models/venue';
import type { SessionWithDetails } from '@/prisma/models/session';
import type { AttendeeRow } from '@/prisma/models/booking';
import type { RequestWithDetails } from '@/prisma/models/private-request';
import type { RecentBooking } from '@/prisma/models/insights';
import { requestState } from '@/lib/shared/session-rules';

// API response shapes. Each mapper keeps the record's own columns and only flattens its relations;
// dates need no mapping because NextResponse.json writes them as ISO strings.
// Relations holding a user record are always destructured out, so their password hash never leaks.

export const toSportDTO = ({ id, nameEn, nameAr, status }: Sport) => ({ id, nameEn, nameAr, status });
export type SportDTO = ReturnType<typeof toSportDTO>;

export const toVenueDTO = ({ id, name, address, city, mapUrl, archivedAt }: Venue) => ({ id, name, address, city, mapUrl, archived: !!archivedAt });
export type VenueDTO = ReturnType<typeof toVenueDTO>;

/** A session with its sport, venue, the coach's name and photo, and `booked` (confirmed bookings). */
export const toSessionDTO = ({ coach, sport, venue, _count, ...s }: SessionWithDetails) => ({
  id: s.id,
  type: s.type,
  level: s.level,
  title: s.title,
  description: s.description,
  startsAt: s.startsAt,
  durationMin: s.durationMin,
  price: s.price,
  capacity: s.capacity,
  booked: _count.bookings,
  status: s.status,
  cancelReason: s.cancelReason,
  seriesId: s.seriesId,
  sport: toSportDTO(sport),
  venue: toVenueDTO(venue),
  coach: { id: coach.id, name: coach.name, photoUrl: blobUrlOrNull(coach.coachProfile?.photoPath) },
});

export type SessionDTO = ReturnType<typeof toSessionDTO>;
/** One session's page: the session plus whether the signed-in member holds a confirmed booking. */
export type SessionDetailDTO = SessionDTO & { bookedByMe: boolean };

export const toAttendeeDTO = ({ id, createdAt, member }: AttendeeRow) => ({
  bookingId: id,
  memberId: member.id,
  name: member.name,
  email: member.email,
  bookedAt: createdAt,
});
export type AttendeeDTO = ReturnType<typeof toAttendeeDTO>;

/** A private request with its state (EXPIRED when a pending request's time has passed), sport, venue and both people. */
export const toRequestDTO = (r: RequestWithDetails, now = new Date()) => ({
  id: r.id,
  status: requestState(r, now),
  startsAt: r.startsAt,
  durationMin: r.durationMin,
  price: r.price,
  message: r.message,
  responseNote: r.responseNote,
  sessionId: r.sessionId,
  createdAt: r.createdAt,
  sport: toSportDTO(r.sport),
  venue: toVenueDTO(r.venue),
  member: { id: r.member.id, name: r.member.name },
  coach: { id: r.coach.id, name: r.coach.name },
});
export type RequestDTO = ReturnType<typeof toRequestDTO>;

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
  privatePrice: p!.privatePrice,
  privateDuration: p!.privateDuration,
  photoUrl: blobUrlOrNull(p!.photoPath),
  links: p!.links.map(({ id, label, url }) => ({ id, label, url })),
  sports: p!.sports.map(({ sport }) => toSportDTO(sport)),
  certifications: p!.certifications.map(toCertificationDTO),
});

export type CoachDTO = ReturnType<typeof toCoachDTO>;

/** What members and guests see of an approved coach: no phone, review details or certificate files, and only approved sports. */
export const toPublicCoachDTO = ({ id, name, coachProfile: p, venues }: Coach) => ({
  id,
  name,
  bio: p!.bio,
  city: p!.city,
  instagram: p!.instagram,
  tiktok: p!.tiktok,
  photoUrl: blobUrlOrNull(p!.photoPath),
  links: p!.links.map(({ id, label, url }) => ({ id, label, url })),
  sports: p!.sports.filter(({ sport }) => sport.status === 'APPROVED').map(({ sport }) => toSportDTO(sport)),
  privatePrice: p!.privatePrice,
  privateDuration: p!.privateDuration,
  venues: venues.map(toVenueDTO),
});

export type PublicCoachDTO = ReturnType<typeof toPublicCoachDTO>;

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

/** A member's own profile. */
export const toMemberDTO = ({ id, name, email, phone, createdAt, favouriteSports }: Member) => ({
  id,
  name,
  email,
  phone,
  createdAt,
  sports: favouriteSports.map(({ sport }) => toSportDTO(sport)),
});

export type MemberDTO = ReturnType<typeof toMemberDTO>;

/** The admin's view of a member: the profile plus whether they're suspended and since when. */
export const toAdminMemberDTO = (member: Member) => ({
  ...toMemberDTO(member),
  suspendedAt: member.suspendedAt,
  emailVerified: !!member.emailVerified,
});

export type AdminMemberDTO = ReturnType<typeof toAdminMemberDTO>;

export const toCoachClientDTO = ({
  member,
  count,
  lastVisit,
}: {
  member: { id: string; name: string; email: string };
  count: number;
  lastVisit: Date | null;
}) => ({
  member,
  count,
  lastVisit,
});
export type CoachClientDTO = ReturnType<typeof toCoachClientDTO>;

export const toMemberCoachDTO = ({
  coach,
  count,
}: {
  coach: { id: string; name: string; photoPath: string | null; city: string | null };
  count: number;
}) => ({
  id: coach.id,
  name: coach.name,
  photoUrl: blobUrlOrNull(coach.photoPath),
  city: coach.city,
  count,
});
export type MemberCoachDTO = ReturnType<typeof toMemberCoachDTO>;

export const toRecentBookingDTO = ({ id, createdAt, member, session }: RecentBooking) => ({
  id,
  createdAt,
  member,
  session: { id: session.id, title: session.title, type: session.type, sport: toSportDTO(session.sport) },
});
export type RecentBookingDTO = ReturnType<typeof toRecentBookingDTO>;
