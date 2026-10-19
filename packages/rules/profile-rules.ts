/** Personal details members and coaches can add to their profile. Shared by the profile pages and the API. No server imports. */

export const GENDERS = ['MALE', 'FEMALE'] as const;
export type Gender = (typeof GENDERS)[number];

/** Languages a coach can say they speak, as ISO 639-1 codes; names come from Intl.DisplayNames in the viewer's language. */
export const SPOKEN_LANGUAGES = ['ar', 'en', 'fr', 'de', 'it', 'es', 'ru'] as const;
export type SpokenLanguage = (typeof SPOKEN_LANGUAGES)[number];

/** A birth date must put the person within this age range today. */
export const MIN_AGE = 5;
export const MAX_AGE = 100;

/** Whole years from a YYYY-MM-DD birth date to `today`, by the calendar date in UTC. */
export function ageOn(birthDate: string, today = new Date()): number {
  const [y, m, d] = birthDate.split('-').map(Number);
  const beforeBirthday = today.getUTCMonth() + 1 < m || (today.getUTCMonth() + 1 === m && today.getUTCDate() < d);
  return today.getUTCFullYear() - y - (beforeBirthday ? 1 : 0);
}

/** A real YYYY-MM-DD date that puts the person between MIN_AGE and MAX_AGE today. */
export function birthDateOk(value: string, today = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const age = ageOn(value, today);
  return age >= MIN_AGE && age <= MAX_AGE;
}

/** A stored birth date (a UTC midnight) as YYYY-MM-DD, which is also what a date input reads and writes. */
export const dateOnly = (date: Date | null) => date?.toISOString().slice(0, 10) ?? null;
