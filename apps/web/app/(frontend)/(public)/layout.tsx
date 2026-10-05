import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LocaleToggle } from '@/components/LocaleToggle';
import { SiteHeader } from '@/components/SiteHeader';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const t = useTranslations('footer');
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
          <div className='dim'>{t('copyright')}</div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Link href='/about' className='muted'>
              {t('about')}
            </Link>
            <Link href='/faq' className='muted'>
              {t('faq')}
            </Link>
            <Link href='/contact' className='muted'>
              {t('contact')}
            </Link>
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  );
}
