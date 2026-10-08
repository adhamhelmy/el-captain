'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { UPLOAD_RULES } from '@/lib/coach-rules';
import { uploadFile } from '@/lib/upload';
import styles from './onboarding.module.css';

/** Picks and uploads the profile photo; the parent saves the returned path with the rest of the step. */
export function PhotoUpload({
  userId,
  url,
  onUploaded,
}: Readonly<{ userId: string; url: string | null; onUploaded: (path: string, previewUrl: string) => void }>) {
  const t = useTranslations('onboarding');
  const te = useTranslations('errors');
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'' | 'invalid_upload' | 'generic'>('');

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    const res = await uploadFile('photo', userId, file);
    setBusy(false);
    if (!res.ok) return setError(res.code);
    onUploaded(res.path, URL.createObjectURL(file));
  }

  let label = t('upload');
  if (busy) label = t('uploading');
  else if (url) label = t('replace');

  return (
    <div className={`stack ${styles.group}`}>
      <div className={styles.photoRow}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview or a small Blob image
          <img src={url} alt='' className={styles.photo} />
        ) : (
          <div className={styles.photo} aria-hidden />
        )}
        <div className={`stack ${styles.group}`}>
          <button type='button' className='btn-ghost sm' disabled={busy} onClick={() => input.current?.click()}>
            {label}
          </button>
          <div className={`muted ${styles.hint}`}>{t('photoHint')}</div>
        </div>
      </div>
      <input ref={input} type='file' hidden accept={UPLOAD_RULES.photo.types.join(',')} onChange={pick} />
      {error && <div className={styles.error}>{te(error)}</div>}
    </div>
  );
}
