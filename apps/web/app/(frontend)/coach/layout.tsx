'use client';
import { usePathname } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { ONBOARDING } from '@/lib/shared/routes';

/** Onboarding renders on its own; the coach nav only makes sense once the coach is approved. */
export default function CoachLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (usePathname().startsWith(ONBOARDING)) return <main>{children}</main>;
  return <Shell role='coach'>{children}</Shell>;
}
