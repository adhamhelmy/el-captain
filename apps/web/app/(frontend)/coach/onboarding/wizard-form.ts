/** The onboarding wizard's form state and how it saves, kept apart from the page so it can be tested. */
import { toLinks, type LinkDraft } from '@/components/LinksEditor';
import type { Certification, Onboarding } from '@/lib/client/coach-api';
import type { SportDTO } from '@/lib/server/dto';
import { REVIEW_STEP, socialHandle, type MissingField, type WizardStep } from '@/lib/shared/coach-rules';

/** The form state; photoPath is only set when a new photo was uploaded and not yet saved. */
export type Form = {
  photoPath?: string;
  photoUrl: string | null;
  /** The coach's area and city, saved in the profile's city field. */
  address: string;
  bio: string;
  instagram: string;
  tiktok: string;
  links: LinkDraft[];
  sports: SportDTO[];
  certifications: Certification[];
};

export const formOf = ({ coach }: Onboarding): Form => ({
  photoUrl: coach.photoUrl,
  address: coach.city ?? '',
  bio: coach.bio ?? '',
  instagram: socialHandle('instagram', coach.instagram),
  tiktok: socialHandle('tiktok', coach.tiktok),
  links: coach.links.map(({ id, label, url }) => ({ key: id, label, url })),
  sports: coach.sports,
  certifications: coach.certifications,
});

/** What each step saves. Locations and certifications save as each one is added, so they have nothing here. */
export function bodyFor(step: WizardStep, form: Form) {
  if (step === 1) return { city: form.address, bio: form.bio, ...(form.photoPath && { photoPath: form.photoPath }) };
  if (step === 2) return { instagram: form.instagram, tiktok: form.tiktok, links: toLinks(form.links) };
  if (step === 3) return { sportIds: form.sports.map((x) => x.id) };
  return null;
}

/** The fields a step saves, as the server returned them (e.g. a social link read back as its handle). */
export function savedPart(step: WizardStep, saved: Form): Partial<Form> {
  if (step === 1) return { photoPath: undefined, photoUrl: saved.photoUrl, address: saved.address, bio: saved.bio };
  if (step === 2) return { instagram: saved.instagram, tiktok: saved.tiktok, links: saved.links };
  if (step === 3) return { sports: saved.sports };
  return {};
}

/** What was last saved for each step, so leaving an untouched step doesn't save it again. */
export type SavedBodies = Partial<Record<WizardStep, string>>;

export const savedBodiesOf = (form: Form): SavedBodies => Object.fromEntries(([1, 2, 3] as const).map((s) => [s, JSON.stringify(bodyFor(s, form))]));

/**
 * Leaving a step, by any route (Continue, Back, the rail, an Edit link): save it first if it changed.
 * True when the wizard may move on; false when the save failed and the coach should stay to fix it.
 */
export async function leaveStep(step: WizardStep, form: Form, saved: SavedBodies, save: (body: object) => Promise<boolean>): Promise<boolean> {
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

/** Optional steps that hold something, so the rail ticks them: socials (2) and certifications (5). */
export function filledSteps(form: Form): Set<WizardStep> {
  const filled = new Set<WizardStep>();
  if (form.instagram.trim() || form.tiktok.trim() || form.links.length) filled.add(2);
  if (form.certifications.length) filled.add(5);
  return filled;
}
