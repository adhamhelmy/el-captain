import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LocaleToggle } from '@/components/LocaleToggle';
import { SiteHeader } from '@/components/SiteHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import styles from './layout.module.css';

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const t = useTranslations('footer');
  return (
    <div className='site'>
      <SiteHeader />
      <main>{children}</main>
      <footer className={styles.footer}>
        <div className={`site-wrap ${styles.bar}`}>
          <div className='dim'>{t('copyright')}</div>
          <div className={styles.links}>
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
