/**
 * The coach profile form's pure parts, shared by the web's onboarding wizard and profile page and the mobile app:
 * extra links, private-session settings, the optional birth date, and what each wizard step saves.
 */
import { REVIEW_STEP, socialHandle, type MissingField, type WizardStep } from './coach-rules';
import { birthDateOk, type Gender } from './profile-rules';
import { privateSettingsOk } from './session-rules';

/** A link row being edited; `key` keeps rows stable while they're reordered. */
export type LinkDraft = { key: string; label: string; url: string };

/** What the API takes: filled-in rows only (a freshly added, untouched row isn't a link yet), without the row keys. */
export const toLinks = (rows: LinkDraft[]) =>
  rows.filter((l) => l.label.trim() || l.url.trim() !== 'https://').map(({ label, url }) => ({ label, url }));

/** The private-session switch and the price and length as typed. Off clears both when saved. */
export type PrivateDraft = { on: boolean; price: string; duration: string };

/** A blank field is "not set" (null), anything else is read as a number. */
const optionalNumber = (v: string) => (v.trim() === '' ? null : Number(v));

export const privateDraftOf = (price: number | null, duration: number | null): PrivateDraft => ({
  on: price !== null && duration !== null,
  price: price === null ? '' : String(price),
  duration: duration === null ? '' : String(duration),
});

/** Off can always be saved; on needs a valid price and length. */
export function privateDraftOk({ on, price, duration }: PrivateDraft) {
  const p = optionalNumber(price);
  const d = optionalNumber(duration);
  return !on || (p !== null && d !== null && privateSettingsOk(p, d));
}

/** What a profile save sends for private sessions. */
export const privateBody = (draft: PrivateDraft) =>
  draft.on
    ? { privatePrice: optionalNumber(draft.price), privateDuration: optionalNumber(draft.duration) }
    : { privatePrice: null, privateDuration: null };

/** A typed birth date that can't be saved; a blank one is fine, the field is optional. */
export const birthDateInvalid = (birthDate: string) => birthDate !== '' && !birthDateOk(birthDate);

/** The parts of the coach's own profile the wizard reads (the web's CoachDTO), generic over its sport and certificate types. */
export type CoachFormSource<S, C> = {
  photoUrl: string | null;
  city: string | null;
  bio: string | null;
  birthDate: string | null;
  gender: Gender | null;
  languages: string[];
  instagram: string | null;
  tiktok: string | null;
  links: { id: string; label: string; url: string }[];
  sports: S[];
  certifications: C[];
  privatePrice: number | null;
  privateDuration: number | null;
};

/** The wizard's form state; photoPath is only set when a new photo was uploaded and not yet saved. */
export type CoachForm<S extends { id: string }, C> = {
  photoPath?: string;
  photoUrl: string | null;
  /** The coach's area and city, saved in the profile's city field. */
  address: string;
  bio: string;
  /** Optional: YYYY-MM-DD or blank, a gender or blank, and spoken language codes. */
  birthDate: string;
  gender: Gender | '';
  languages: string[];
  instagram: string;
  tiktok: string;
  links: LinkDraft[];
  sports: S[];
  certifications: C[];
  private: PrivateDraft;
};

export const formOf = <S extends { id: string }, C>({ coach }: { coach: CoachFormSource<S, C> }): CoachForm<S, C> => ({
  photoUrl: coach.photoUrl,
  address: coach.city ?? '',
  bio: coach.bio ?? '',
  birthDate: coach.birthDate ?? '',
  gender: coach.gender ?? '',
  languages: coach.languages,
  instagram: socialHandle('instagram', coach.instagram),
  tiktok: socialHandle('tiktok', coach.tiktok),
  links: coach.links.map(({ id, label, url }) => ({ key: id, label, url })),
  sports: coach.sports,
  certifications: coach.certifications,
  private: privateDraftOf(coach.privatePrice, coach.privateDuration),
});

type AnyForm = CoachForm<{ id: string }, unknown>;

/** What each step saves. Locations and certifications save as each one is added, so they have nothing here. */
export function bodyFor(step: WizardStep, form: AnyForm) {
  if (step === 1) {
    return {
      city: form.address,
      bio: form.bio,
      birthDate: form.birthDate || null,
      gender: form.gender || null,
      languages: form.languages,
      ...(form.photoPath && { photoPath: form.photoPath }),
    };
  }
  if (step === 2) return { instagram: form.instagram, tiktok: form.tiktok, links: toLinks(form.links) };
  if (step === 3) return { sportIds: form.sports.map((x) => x.id) };
  if (step === 6) return privateBody(form.private);
  return null;
}

/** The fields a step saves, as the server returned them (e.g. a social link read back as its handle). */
export function savedPart<F extends AnyForm>(step: WizardStep, saved: F): Partial<F> {
  if (step === 1) {
    const { photoUrl, address, bio, birthDate, gender, languages } = saved;
    return { photoPath: undefined, photoUrl, address, bio, birthDate, gender, languages } as Partial<F>;
  }
  if (step === 2) return { instagram: saved.instagram, tiktok: saved.tiktok, links: saved.links } as Partial<F>;
  if (step === 3) return { sports: saved.sports } as Partial<F>;
  if (step === 6) return { private: saved.private } as Partial<F>;
  return {};
}

/** What was last saved for each step, so leaving an untouched step doesn't save it again. */
export type SavedBodies = Partial<Record<WizardStep, string>>;

export const savedBodiesOf = (form: AnyForm): SavedBodies =>
  Object.fromEntries(([1, 2, 3, 6] as const).map((s) => [s, JSON.stringify(bodyFor(s, form))]));

/**
 * Leaving a step, by any route (Continue, Back, the rail, an Edit link): save it first if it changed.
 * True when the wizard may move on; false when the save failed and the coach should stay to fix it.
 */
export async function leaveStep(step: WizardStep, form: AnyForm, saved: SavedBodies, save: (body: object) => Promise<boolean>): Promise<boolean> {
  const body = bodyFor(step, form);
  if (!body) return true;
  const key = JSON.stringify(body);
  if (saved[step] === key) return true;
  const ok = await save(body);
  if (ok) saved[step] = key;
  return ok;
}

/** Submit (on the review step) stays disabled until nothing required is missing; the server checks again anyway. */
export const submitBlocked = (step: WizardStep, missing: MissingField[]) => step === REVIEW_STEP && missing.length > 0;

/** Optional steps that hold something, so the rail ticks them: socials (2), certifications (5) and private sessions (6). */
export function filledSteps(form: AnyForm): Set<WizardStep> {
  const filled = new Set<WizardStep>();
  if (form.instagram.trim() || form.tiktok.trim() || form.links.length) filled.add(2);
  if (form.certifications.length) filled.add(5);
  if (form.private.on) filled.add(6);
  return filled;
}
