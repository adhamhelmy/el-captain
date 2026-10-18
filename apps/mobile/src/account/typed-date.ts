/**
 * Dates and times typed into a text field, as the shared rules expect them ('YYYY-MM-DD', 'HH:MM').
 * Arabic keyboards type ٠-٩ (and Persian ۰-۹), and people often skip leading zeros, so both are accepted.
 */
const latinDigits = (s: string) => s.trim().replace(/[٠-٩۰-۹]/g, (d) => String(d.codePointAt(0)! & 0xf));
const pad = (n: string) => n.padStart(2, '0');

export function typedDate(input: string): string | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(latinDigits(input));
  return m ? `${m[1]}-${pad(m[2])}-${pad(m[3])}` : null;
}

export function typedTime(input: string): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(latinDigits(input));
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  return `${pad(m[1])}:${m[2]}`;
}
