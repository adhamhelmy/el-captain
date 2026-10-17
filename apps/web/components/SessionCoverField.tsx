'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getOnboarding, type Media } from '@/lib/client/coach-api';
import { uploadFile } from '@/lib/client/upload';
import { UPLOAD_RULES } from '@/lib/shared/coach-rules';
import onb from './onboarding.module.css';
import styles from './SessionCoverField.module.css';

/** What the session form sends for its cover: a new upload's path, a gallery photo's id, or null to remove it. */
export type CoverChoice = { url: string | null; body: { coverPath: string | null } | { coverMediaId: string } };

/**
 * The session's cover photo: a preview, then Upload photo, Choose from your photos (the coach's gallery, loaded the
 * first time it opens) and Remove. Optional; nothing is sent until the coach changes it.
 */
export function SessionCoverField({ coachId, url, onChange }: Readonly<{ coachId: string; url: string | null; onChange: (c: CoverChoice) => void }>) {
  const t = useTranslations('schedule');
  const to = useTranslations('onboarding');
  const te = useTranslations('errors');
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const [photos, setPhotos] = useState<Media[] | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    const res = await uploadFile('sessionCover', coachId, file);
    setBusy(false);
    if (!res.ok) return setError(te(res.code));
    setPicking(false);
    onChange({ url: URL.createObjectURL(file), body: { coverPath: res.path } });
  }

  function openGallery() {
    setPicking(!picking);
    if (photos) return;
    getOnboarding()
      .then((r) => setPhotos(r.ok ? r.data.coach.media.filter((m) => m.kind === 'PHOTO') : []))
      .catch(() => setPhotos([]));
  }

  let gallery: React.ReactNode = <div className={onb.photoHint}>{to('uploading')}</div>;
  if (photos?.length === 0)
    gallery = (
      <div className='muted'>
        <Link href='/coach/profile#media'>{t('coverNoPhotos')}</Link>
      </div>
    );
  else if (photos)
    gallery = (
      <div className={styles.grid}>
        {photos.map((m) => (
          <button
            key={m.id}
            type='button'
            className={m.url === url ? `${styles.tile} ${styles.on}` : styles.tile}
            aria-label={m.caption ?? t('coverPhoto')}
            onClick={() => {
              setPicking(false);
              onChange({ url: m.url, body: { coverMediaId: m.id } });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- a Blob image */}
            <img src={m.url} alt='' loading='lazy' />
          </button>
        ))}
      </div>
    );

  return (
    <div className={styles.field}>
      <span className='label'>{t('coverOptional')}</span>
      <div className={styles.preview}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview or a Blob image
          <img src={url} alt='' />
        ) : (
          <span className={styles.empty}>{t('coverEmpty')}</span>
        )}
      </div>
      <div className={styles.actions}>
        <button type='button' className='btn-ghost sm' disabled={busy} onClick={() => input.current?.click()}>
          {busy ? to('uploading') : t('coverUpload')}
        </button>
        <button type='button' className='btn-ghost sm' aria-expanded={picking} onClick={openGallery}>
          {t('coverChoose')}
        </button>
        {url && (
          <button type='button' className={onb.textBtn} onClick={() => onChange({ url: null, body: { coverPath: null } })}>
            {to('remove')}
          </button>
        )}
      </div>
      {picking && gallery}
      <input ref={input} type='file' hidden accept={UPLOAD_RULES.sessionCover.types.join(',')} onChange={pick} />
      {error && <div className={onb.error}>{error}</div>}
    </div>
  );
}
