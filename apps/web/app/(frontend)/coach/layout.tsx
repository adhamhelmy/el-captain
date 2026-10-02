import { Shell } from '@/components/Shell';

export default function CoachLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Shell role='coach' sub='Coach'>
      {children}
    </Shell>
  );
}
