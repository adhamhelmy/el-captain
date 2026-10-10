/** The live summary under the new-session form: "4 sessions, every Tuesday at 6:30 PM, starting Tue Oct 21." */
import { fromWallClock } from '@/lib/shared/app-time';

/** How the summary formats a date; the page passes next-intl's formatter, tests pass Intl directly. */
export type SummaryFormat = { weekdayLong: (d: Date) => string; day: (d: Date) => string; dayMonth: (d: Date) => string; time: (d: Date) => string };

/** The repeat choices offered: one session, or weekly for a fixed number of weeks (each a separate session). */
export const REPEAT_OPTIONS = [1, 2, 4, 8, 12] as const;

/**
 * The values for the `schedule.summary` message. `count` is 0 until the date and time make a real moment,
 * so the message can ask for them instead.
 */
export function summaryValues(date: string, time: string, repeat: number, f: SummaryFormat) {
  const at = fromWallClock({ date, time });
  if (!at) return { count: 0, weekday: '', date: '', time: '' };
  return { count: repeat, weekday: f.weekdayLong(at), date: `${f.day(at)} ${f.dayMonth(at)}`, time: f.time(at) };
}
