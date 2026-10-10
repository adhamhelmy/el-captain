'use client';
import { useLocale, useTranslations } from 'next-intl';
import { sportName } from '@/lib/shared/coach-rules';
import type { Form } from './wizard-form';
import styles from './onboarding.module.css';

/** "What members see": the coach's public card, updated as they type. */
export function ProfilePreview({ name, form }: Readonly<{ name: string; form: Form }>) {
  const t = useTranslations('onboarding');
  const locale = useLocale();
  const address = form.address.trim();
  const bio = form.bio.trim();
  const social = [
    form.instagram.trim() && t('onInstagram', { handle: form.instagram.trim().replace(/^@/, '') }),
    form.tiktok.trim() && t('onTiktok', { handle: form.tiktok.trim().replace(/^@/, '') }),
  ].filter(Boolean);

  return (
    <div className={styles.preview}>
      <div className={styles.previewBanner} />
      <div className={styles.previewBody}>
        {form.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview or a small Blob image
          <img src={form.photoUrl} alt='' className={styles.previewPhoto} />
        ) : (
          <div className={`${styles.previewPhoto} ${styles.previewNoPhoto}`}>{t('previewPhoto')}</div>
        )}
        <div>
          <bdi className={styles.previewName}>{name}</bdi>
          <div dir='auto' className={styles.previewPlace}>
            {address ? t('previewPlace', { address }) : t('previewCoach')}
          </div>
        </div>
        {form.sports.length > 0 && (
          <div className={styles.previewTags}>
            {form.sports.map((s) => (
              <span key={s.id} className='tag tag-accent'>
                <bdi>{sportName(s, locale)}</bdi>
              </span>
            ))}
          </div>
        )}
        <div dir='auto' className={bio ? styles.previewBio : `${styles.previewBio} ${styles.previewEmpty}`}>
          {bio || t('previewBio')}
        </div>
        {social.length > 0 && (
          <div dir='ltr' className={styles.previewSocial}>
            {social.join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}
