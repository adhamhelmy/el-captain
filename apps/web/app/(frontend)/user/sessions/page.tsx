import { redirect } from 'next/navigation';

/** Browsing moved to Explore; old links land there. */
export default function BrowseSessionsPage() {
  redirect('/user/explore');
}
