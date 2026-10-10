/** Converting between UTC instants and wall-clock time in the app's zone (Cairo). No server imports. */
import { APP_TZ } from '@/i18n/locale';

/** A local date and time in APP_TZ, as a date input ('YYYY-MM-DD') and a time input ('HH:mm') hold them. */
export type WallClock = { date: string; time: string };

const PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function wallClock(at: Date): WallClock {
  const p = Object.fromEntries(PARTS.formatToParts(at).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** How far APP_TZ is ahead of UTC at this instant, in ms. */
function offsetMs(at: Date) {
  const w = wallClock(at);
  return Date.parse(`${w.date}T${w.time}:00Z`) - Math.floor(at.getTime() / 60_000) * 60_000;
}

/** The UTC instant of a wall-clock time in APP_TZ. Null when malformed or when daylight saving skips that time. */
export function fromWallClock({ date, time }: WallClock): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const naive = Date.parse(`${date}T${time}:00Z`);
  if (Number.isNaN(naive)) return null;
  // The offset at the naive instant can be wrong by an hour near a change; the second pass settles it.
  const first = naive - offsetMs(new Date(naive));
  const utc = new Date(naive - offsetMs(new Date(first)));
  const back = wallClock(utc);
  return back.date === date && back.time === time ? utc : null;
}

/** The same wall-clock time `weeks` weeks later, so 19:00 stays 19:00 across daylight saving. */
export function addWeeks(at: Date, weeks: number): Date | null {
  const w = wallClock(at);
  const day = new Date(`${w.date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 7 * weeks);
  return fromWallClock({ date: day.toISOString().slice(0, 10), time: w.time });
}
