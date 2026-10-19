/** Search helpers for Explore, matching the web's components/Explore.tsx. */
type SportLike = { id: string; nameEn: string; nameAr: string | null };

/** The query string for /api/sessions and /api/coaches. */
export function exploreQuery({ sport, q }: { sport: string; q: string }) {
  return new URLSearchParams({ limit: '50', ...(sport !== 'all' && { sport }), ...(q && { q }) }).toString();
}

/** Sports whose name (English or Arabic) contains the search, other than the one already picked. */
export function sportHits<S extends SportLike>(sports: S[], needle: string, picked: string): S[] {
  if (!needle) return [];
  const n = needle.toLocaleLowerCase();
  return sports.filter((s) => s.id !== picked && [s.nameEn, s.nameAr].some((name) => name?.toLocaleLowerCase().includes(n)));
}
