/**
 * Date math for the calendar picker, on 'YYYY-MM-DD' wall-clock dates (no time zone involved).
 * Weeks start on Saturday, as the coach's week view does.
 */
const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (date: string) => new Date(`${date}T00:00:00Z`);

/** The first of the month a date falls in, as 'YYYY-MM-01'. */
export const monthOf = (date: string) => `${date.slice(0, 7)}-01`;

/** The first of the month `n` months after (or before) the given one. */
export function addMonths(month: string, n: number): string {
  const d = utc(monthOf(month));
  d.setUTCMonth(d.getUTCMonth() + n);
  return iso(d);
}

/** The month's days in weeks of seven, Saturday first; days outside the month are null. */
export function monthGrid(month: string): (string | null)[][] {
  const first = utc(monthOf(month));
  const lead = (first.getUTCDay() + 1) % 7; // Saturday = 0
  const days: (string | null)[] = Array.from({ length: lead }, () => null);
  for (const d = new Date(first); d.getUTCMonth() === first.getUTCMonth(); d.setUTCDate(d.getUTCDate() + 1)) days.push(iso(d));
  while (days.length % 7) days.push(null);
  return Array.from({ length: days.length / 7 }, (_, w) => days.slice(w * 7, w * 7 + 7));
}

/** Whether a date is inside the allowed range (either end may be open). Same-format strings compare as dates. */
export const inRange = (date: string, min?: string, max?: string) => (!min || date >= min) && (!max || date <= max);

/** A date `years` years before (negative) or after the given one, for age limits. 29 Feb becomes 28 Feb, never 1 Mar. */
export function addYears(date: string, years: number): string {
  const d = utc(date);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  if (d.getUTCMonth() !== Number(date.slice(5, 7)) - 1) d.setUTCDate(0);
  return iso(d);
}

/** Where the calendar opens: the picked date, else today, kept inside the allowed range. */
export function startMonth(value: string, today: string, min?: string, max?: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return monthOf(value);
  if (max && today > max) return monthOf(max);
  if (min && today < min) return monthOf(min);
  return monthOf(today);
}

/** A month pulled back inside the allowed range, for jumping years from the year grid. */
export function clampMonth(month: string, min?: string, max?: string): string {
  if (min && month < monthOf(min)) return monthOf(min);
  if (max && month > monthOf(max)) return monthOf(max);
  return month;
}
