/** "1:15" or "1:02:05" from a length in seconds. */
export function clockLength(totalSec: number) {
  const s = Math.max(0, Math.round(totalSec));
  const [h, m, sec] = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
