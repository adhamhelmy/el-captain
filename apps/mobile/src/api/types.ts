/**
 * JSON shapes the API returns, as the app reads them. The web infers these from its database mappers
 * (apps/web/lib/server/dto.ts), which the app can't import; keep the two in step when a DTO changes.
 */
import type { PaymentMethod } from '@el-captain/rules/payment-rules';
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
  /** How a member can pay: empty for a free session. Missing from servers older than cash payments. */
  methods?: PaymentMethod[];
};

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'REFUND_FAILED';

/** How the member is paying for their booking (the web's MemberPaymentDTO). */
export type MemberPayment = { method: PaymentMethod; status: PaymentStatus; amount: number };

/**
 * One session's page: the session plus whether the signed-in member holds a confirmed booking.
 * After booking a paid session by card, `checkoutUrl` is the payment page. `payBy` is set while the member holds an unpaid spot.
 * `payment` is how the member is paying, once they have a booking.
 */
export type SessionDetail = Session & { bookedByMe: boolean; checkoutUrl?: string; payBy?: string | null; payment?: MemberPayment | null };

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
  /** An accepted paid request: `due` until the member pays (by `payBy`), `lapsed` if they didn't. */
  payment: 'due' | 'lapsed' | null;
  payBy: string | null;
};

/** A coach the member has trained with, and how many sessions together. */
export type MemberCoach = { id: string; name: string; photoUrl: string | null; city: string | null; count: number };

/** A coach's own venue, with how many upcoming sessions use it. */
export type CoachVenue = Venue & { upcoming: number };

/** Someone booked on a coach's session. */
/** A booked member; `payment` says how they pay, and the coach marks cash ones. */
export type Attendee = {
  bookingId: string;
  memberId: string;
  name: string;
  email: string;
  bookedAt: string;
  payment?: { id: string; method: PaymentMethod; status: PaymentStatus } | null;
};

/** The coach's numbers on their dashboard. fillRate is null until a session has run. */
export type CoachStats = { bookingsNext7: number; earnings30: number; fillRate: number | null };

/** One row of the coach's client list. */
export type CoachClient = { member: { id: string; name: string; email: string }; count: number; lastVisit: string | null; since: string };

/** One client and every session they had with the coach, newest first. */
export type CoachClientDetail = { member: { id: string; name: string; email: string; phone: string | null; createdAt: string }; sessions: Session[] };

/** The signed-in coach's own profile (the web's CoachDTO). */
export type CoachMe = {
  id: string;
  coachName: string;
  birthDate: string | null;
  gender: Gender | null;
  languages: string[];
  status: string;
  submittedAt: string | null;
  bio: string | null;
  city: string | null;
  phone: string | null;
  instagram: string | null;
  tiktok: string | null;
  privatePrice: number | null;
  privateDuration: number | null;
  /** Missing from servers that predate cash payments. */
  photoUrl: string | null;
  coverUrl: string | null;
  links: { id: string; label: string; url: string }[];
  sports: Sport[];
  certifications: { id: string; title: string; fileName: string; contentType: string; size: number; createdAt: string }[];
  media: Media[];
};

/** GET /api/coaches/me/onboarding. */
export type Onboarding = { coach: CoachMe; missing: string[]; reason: string | null };
