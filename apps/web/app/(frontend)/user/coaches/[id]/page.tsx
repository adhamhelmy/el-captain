import { CoachProfile } from '@/components/CoachProfile';

export default async function CoachPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return <CoachProfile id={(await params).id} area='/user' />;
}
