import { redirect } from 'next/navigation';

/** The coach directory moved into Explore; old links land there. */
export default function CoachesPage() {
  redirect('/user/explore');
}
