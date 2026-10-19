type SportLike = { id: string };

/** Sports to filter a coach's page by: those with sessions or media, each once, in first-seen order (as the web's). */
export function filterSports<S extends SportLike>(sessions: { sport: S }[], media: { sport: S | null }[]): S[] {
  return [...new Map([...sessions.map((s) => s.sport), ...media.flatMap((m) => (m.sport ? [m.sport] : []))].map((s) => [s.id, s])).values()];
}
