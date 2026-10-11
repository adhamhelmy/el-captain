/** Converting between a time input's 'HH:mm' and the 12-hour parts the session form shows. No server imports. */

export type Period = 'AM' | 'PM';
export type Clock12 = { hour: number; minute: number; period: Period };

/** '18:30' → 6:30 PM. Null for anything that isn't a valid 'HH:mm'. */
export function to12(time: string): Clock12 | null {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return null;
  const [h, min] = [Number(m[1]), Number(m[2])];
  if (h > 23 || min > 59) return null;
  return { hour: h % 12 || 12, minute: min, period: h < 12 ? 'AM' : 'PM' };
}

/** 6:30 PM → '18:30'; 12 AM is midnight and 12 PM is noon. */
export function to24({ hour, minute, period }: Clock12): string {
  const h = (hour % 12) + (period === 'PM' ? 12 : 0);
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
