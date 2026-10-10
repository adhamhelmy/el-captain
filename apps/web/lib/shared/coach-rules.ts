/**
 * Coach onboarding rules shared by the API and the pages. No server imports.
 * Limits here are the single source of truth; the UI and the routes both read them.
 */
export const BIO_MAX = 1000;
export const CITY_MAX = 80;
export const NAME_MAX = 80;
export const MAX_LINKS = 5;
export const LINK_LABEL_MAX = 40;
export const MIN_SPORTS = 1;
export const MAX_SPORTS = 10;
export const MAX_CERTS = 10;
export const CERT_TITLE_MAX = 80;
export const SPORT_NAME_MIN = 2;
export const SPORT_NAME_MAX = 40;
/** Longest admin search kept; the rest is dropped. */
export const SEARCH_MAX = 100;
/** How old the account status in the session token (suspension, a coach's review status) may get before it is read again. */
export const STATUS_RECHECK_MS = 5 * 60 * 1000;

/** A coach's review status, in lifecycle order. Matches the CoachStatus enum in the Prisma schema. */
export const COACH_STATUSES = ['INCOMPLETE', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'] as const;
export type CoachStatus = (typeof COACH_STATUSES)[number];

export const isCoachStatus = (v: unknown): v is CoachStatus => COACH_STATUSES.includes(v as CoachStatus);

const TRANSITIONS: Record<'coach' | 'admin', Partial<Record<CoachStatus, CoachStatus[]>>> = {
  coach: { INCOMPLETE: ['PENDING'], REJECTED: ['PENDING'] },
  admin: { PENDING: ['ACTIVE', 'REJECTED'], ACTIVE: ['SUSPENDED'], SUSPENDED: ['ACTIVE'] },
};

/** Whether `actor` may move a coach from `from` to `to`. */
export const canTransition = (from: CoachStatus, to: CoachStatus, actor: 'coach' | 'admin') => TRANSITIONS[actor][from]?.includes(to) ?? false;

const SOCIAL = {
  instagram: { host: 'instagram.com', handle: /^[A-Za-z0-9._]{1,30}$/, url: (h: string) => `https://www.instagram.com/${h}` },
  tiktok: { host: 'tiktok.com', handle: /^[A-Za-z0-9._]{2,24}$/, url: (h: string) => `https://www.tiktok.com/@${h}` },
} as const;

/** Reads the handle out of a pasted profile link; null when the link is to another site. */
function handleFromUrl(raw: string, host: string): string | null {
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const h = u.hostname.toLowerCase();
    if (h !== host && !h.endsWith(`.${host}`)) return null;
    return u.pathname.split('/').find(Boolean) ?? '';
  } catch {
    return null;
  }
}

/**
 * A profile link from whatever the coach pasted: "@name", "name" or a profile URL.
 * Null when it isn't a handle or a link to that network.
 */
export function normalizeSocial(network: keyof typeof SOCIAL, input: string): string | null {
  const { host, handle, url } = SOCIAL[network];
  let raw = input.trim();
  if (raw.includes('/')) {
    const fromUrl = handleFromUrl(raw, host);
    if (fromUrl === null) return null;
    raw = fromUrl;
  }
  raw = raw.replace(/^@/, '');
  return handle.test(raw) ? url(raw) : null;
}

/** Extra profile links must be https and point at a real host name. */
export function isValidLinkUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.includes('.');
  } catch {
    return false;
  }
}

/** The duplicate-check key for a sport name: "  Kick  Boxing " and "kick boxing" are the same sport. */
export const sportKey = (name: string) => name.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');

/** A sport name as typed, tidied for storage. */
export const cleanSportName = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
export const isValidSportName = (n: string) => n.length >= SPORT_NAME_MIN && n.length <= SPORT_NAME_MAX;

/** The sport's name in the reader's language (an Intl locale such as "ar-EG-u-nu-latn"), English when there's no Arabic yet. */
export const sportName = (s: { nameEn: string; nameAr: string | null }, locale: string) => (locale.startsWith('ar') && s.nameAr) || s.nameEn;

export type UploadKind = 'photo' | 'certificate';

const IMAGES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const UPLOAD_RULES: Record<UploadKind, { types: readonly string[]; maxBytes: number; folder: string }> = {
  photo: { types: IMAGES, maxBytes: 5 * 1024 * 1024, folder: 'photo' },
  certificate: { types: [...IMAGES, 'application/pdf'], maxBytes: 10 * 1024 * 1024, folder: 'certs' },
};

export const uploadPrefix = (userId: string, kind: UploadKind) => `coaches/${userId}/${UPLOAD_RULES[kind].folder}/`;

/** Whether `path` is a file name directly inside this coach's folder for this kind of upload. */
export function ownsUpload(userId: string, kind: UploadKind, path: unknown): path is string {
  if (typeof path !== 'string') return false;
  const prefix = uploadPrefix(userId, kind);
  const rest = path.slice(prefix.length);
  return path.startsWith(prefix) && rest.length > 0 && !rest.includes('/') && !rest.includes('..');
}

/** What must be filled in before submitting. Instagram and TikTok are optional. */
export type MissingField = 'photo' | 'bio' | 'sports';
export type Draft = {
  photoPath: string | null;
  bio: string | null;
  instagram: string | null;
  tiktok: string | null;
  sportCount: number;
};

/** What still stops the coach from submitting, in wizard order. */
export function missingFields(d: Draft): MissingField[] {
  const bio = d.bio?.trim().length ?? 0;
  const checks: [MissingField, boolean][] = [
    ['photo', !!d.photoPath],
    // Any length is fine; admins judge the content when they review.
    ['bio', bio > 0 && bio <= BIO_MAX],
    ['sports', d.sportCount >= MIN_SPORTS && d.sportCount <= MAX_SPORTS],
  ];
  return checks.filter(([, ok]) => !ok).map(([field]) => field);
}

/** The wizard step each field lives on. */
export const STEP_OF: Record<MissingField, 1 | 3> = { photo: 1, bio: 1, sports: 3 };

/** The step the wizard opens on: the first one with something missing, else the last (certifications). */
export const firstIncompleteStep = (missing: MissingField[]): 1 | 2 | 3 | 4 => (missing.length ? STEP_OF[missing[0]] : 4);
