'use client';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { accent, br } from '@/components/rich';
import styles from './layout.module.css';

/** The brand panel's headline; signing up as a coach gets its own. */
export function BrandTitle() {
  const t = useTranslations('authBrand');
  const th = useTranslations('home');
  const path = usePathname();
  const params = useSearchParams();
  const coach = path === '/register' && params.get('role') === 'coach';
  return (
    <div>
      <div className={`display lh-88 ${styles.title}`}>{t.rich(coach ? 'coachTitle' : 'title', { br, accent })}</div>
      <div className={`muted ${styles.tagline}`}>{coach ? th('coachText') : t('tagline')}</div>
    </div>
  );
}
