import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className='site'>
      <SiteHeader />
      <main>{children}</main>
      <footer style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className='site-wrap'
          style={{
            paddingTop: 32,
            paddingBottom: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            fontSize: 13,
          }}
        >
          <div className='dim'>© 2026 El Captain</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href='/about' className='muted'>
              About
            </Link>
            <Link href='/faq' className='muted'>
              FAQ
            </Link>
            <Link href='/contact' className='muted'>
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
