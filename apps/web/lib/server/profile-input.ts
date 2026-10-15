import { assertValid } from '@/lib/server/api';
import { ERROR_CODES } from '@/lib/shared/error-codes';
import { birthDateOk, GENDERS, SPOKEN_LANGUAGES, type Gender } from '@/lib/shared/profile-rules';

const invalid = (ok: unknown, message: string) => assertValid(ok, message, ERROR_CODES.INVALID_PROFILE);

/** The birth date and gender from a profile save. Undefined leaves a field as it is; "" or null clears it. */
export function readPersonal(body: Record<string, unknown>): { birthDate?: Date | null; gender?: Gender | null } {
  const out: { birthDate?: Date | null; gender?: Gender | null } = {};
  if (body.birthDate !== undefined) {
    const v = body.birthDate;
    if (v === null || v === '') out.birthDate = null;
    else {
      invalid(typeof v === 'string' && birthDateOk(v), 'Invalid birth date');
      out.birthDate = new Date(`${v as string}T00:00:00Z`);
    }
  }
  if (body.gender !== undefined) {
    const v = body.gender;
    invalid(v === null || v === '' || GENDERS.includes(v as Gender), 'Invalid gender');
    out.gender = (v || null) as Gender | null;
  }
  return out;
}

/** A coach's spoken languages: known codes, no repeats, kept in the order of SPOKEN_LANGUAGES. */
export function readLanguages(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  invalid(Array.isArray(value) && value.every((v) => (SPOKEN_LANGUAGES as readonly unknown[]).includes(v)), 'Invalid languages');
  return SPOKEN_LANGUAGES.filter((l) => (value as unknown[]).includes(l));
}
