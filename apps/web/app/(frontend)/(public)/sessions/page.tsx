import { redirect } from 'next/navigation';

/** Browsing moved to Explore; old links (and their ?q= or ?sport=) land there. */
export default async function PublicSessionsPage({ searchParams }: Readonly<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>) {
  const { q, sport } = await searchParams;
  const query = new URLSearchParams({ ...(typeof q === 'string' && { q }), ...(typeof sport === 'string' && { sport }) }).toString();
  redirect(query ? `/explore?${query}` : '/explore');
}
