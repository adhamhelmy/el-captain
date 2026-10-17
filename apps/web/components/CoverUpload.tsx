'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { UPLOAD_RULES } from '@/lib/shared/coach-rules';
import { uploadFile } from '@/lib/client/upload';
import onb from './onboarding.module.css';
import photo from './PhotoUpload.module.css';
import styles from './CoverUpload.module.css';

/**
 * The cover banner is its own upload button, like the profile photo: hover or focus says what a click does,
 * touch screens get a pencil badge. The parent saves the returned path with the rest of the form.
 */
export function CoverUpload({ userId, url, onUploaded }: Readonly<{ userId: string; url: string | null; onUploaded: (path: string, previewUrl: string) => void }>) {
  const t = useTranslations('coachEdit');
  const to = useTranslations('onboarding');
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
    const res = await uploadFile('cover', userId, file);
    setBusy(false);
    if (!res.ok) return setError(res.code);
    onUploaded(res.path, URL.createObjectURL(file));
  }

  let label = t('coverAdd');
  if (busy) label = to('uploading');
  else if (url) label = t('coverReplace');

  return (
    <>
      <button
        type='button'
        className={[photo.target, styles.cover, busy && photo.busy].filter(Boolean).join(' ')}
        disabled={busy}
        aria-label={label}
        onClick={() => input.current?.click()}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview or a Blob image
          <img src={url} alt='' className={styles.image} />
        ) : (
          <span className={styles.hint}>{t('coverHint')}</span>
        )}
        <span className={`${photo.overlay} ${styles.overlay}`} aria-hidden>
          {label}
        </span>
        <span className={`${photo.badge} ${styles.badge}`} aria-hidden>
          <svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M11 2.5l2.5 2.5L5.5 13H3v-2.5z' />
          </svg>
        </span>
      </button>
      <input ref={input} type='file' hidden accept={UPLOAD_RULES.cover.types.join(',')} onChange={pick} />
      {error && <div className={onb.error}>{te(error)}</div>}
    </>
  );
}
