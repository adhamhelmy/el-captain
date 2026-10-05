import { Shell } from '@/components/Shell';

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Shell role='admin'>
      {children}
    </Shell>
  );
}
