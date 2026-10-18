/**
 * JSON shapes the API returns, as the app reads them. The web infers these from its database mappers
 * (apps/web/lib/server/dto.ts), which the app can't import; keep the two in step when a DTO changes.
 */
import type { Gender } from '@el-captain/rules/profile-rules';

export type Sport = { id: string; nameEn: string; nameAr: string | null; status: string };

export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  gender: Gender | null;
  createdAt: string;
  sports: Sport[];
};

export type Venue = { id: string; name: string; address: string; city: string; mapUrl: string | null; archived: boolean };

export type Session = {
  id: string;
  type: 'GROUP' | 'PRIVATE';
  level: 'ALL_LEVELS' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | null;
  title: string;
  description: string | null;
  coverUrl: string | null;
  startsAt: string;
  durationMin: number;
  price: number;
  capacity: number;
  booked: number;
  status: string;
  cancelReason: string | null;
  seriesId: string | null;
  sport: Sport;
  venue: Venue;
  coach: { id: string; name: string; photoUrl: string | null };
};

/** One session's page: the session plus whether the signed-in member holds a confirmed booking. */
export type SessionDetail = Session & { bookedByMe: boolean };

export type Media = { id: string; kind: 'PHOTO' | 'VIDEO'; url: string; caption: string | null; sport: Sport | null; durationSec: number | null };

export type PublicCoach = {
  id: string;
  name: string;
  age: number | null;
  gender: Gender | null;
  languages: string[];
  bio: string | null;
  city: string | null;
  instagram: string | null;
  tiktok: string | null;
  photoUrl: string | null;
  coverUrl: string | null;
  links: { id: string; label: string; url: string }[];
  sports: Sport[];
  privatePrice: number | null;
  privateDuration: number | null;
  venues: Venue[];
  media: Media[];
  certifications: { id: string; title: string; contentType: string }[];
};

export type RequestState = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

/** A private session request, from either side. */
export type PrivateRequest = {
  id: string;
  status: RequestState;
  startsAt: string;
  durationMin: number;
  price: number;
  message: string | null;
  responseNote: string | null;
  sessionId: string | null;
  createdAt: string;
  sport: Sport;
  venue: Venue;
  member: { id: string; name: string };
  coach: { id: string; name: string };
};

/** A coach the member has trained with, and how many sessions together. */
export type MemberCoach = { id: string; name: string; photoUrl: string | null; city: string | null; count: number };
