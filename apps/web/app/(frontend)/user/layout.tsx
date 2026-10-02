import { Shell } from '@/components/Shell';

export default function UserLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Shell role='user' sub='Member'>
      {children}
    </Shell>
  );
}
