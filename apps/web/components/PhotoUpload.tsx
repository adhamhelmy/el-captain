'use client';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { UPLOAD_RULES } from '@/lib/shared/coach-rules';
import { uploadFile } from '@/lib/client/upload';
import onb from './onboarding.module.css';
import styles from './PhotoUpload.module.css';

/**
 * The profile photo is its own upload button: hover or focus shows what a click does, and touch screens get a small
 * pencil badge instead. The parent saves the returned path with the rest of the form.
 * `large` makes it 112px instead of 96px; `ring` adds a surface-coloured ring for when the photo overlaps a cover.
 */
export function PhotoUpload({
  userId,
  url,
  onUploaded,
  warn,
  large,
  ring,
}: Readonly<{
  userId: string;
  url: string | null;
  onUploaded: (path: string, previewUrl: string) => void;
  warn?: boolean;
  large?: boolean;
  ring?: boolean;
}>) {
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

  const classes = [styles.target, styles.photo, !url && styles.empty, warn && !url && styles.warn, ring && styles.ring, large && styles.large, busy && styles.busy].filter(Boolean).join(' ');

  return (
    <div className={`stack ${onb.group}`}>
      <div className={styles.row}>
        <button
          type='button'
          className={classes}
          disabled={busy}
          aria-label={label}
          onClick={() => input.current?.click()}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local preview or a small Blob image
            <img src={url} alt='' className={styles.image} />
          ) : (
            <span className={styles.plus} aria-hidden>
              +
            </span>
          )}
          <span className={styles.overlay} aria-hidden>
            {label}
          </span>
          <span className={styles.badge} aria-hidden>
            <svg viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M11 2.5l2.5 2.5L5.5 13H3v-2.5z' />
            </svg>
          </span>
        </button>
        <div className={onb.photoHint}>{t('photoHint')}</div>
      </div>
      <input ref={input} type='file' hidden accept={UPLOAD_RULES.photo.types.join(',')} onChange={pick} />
      {error && <div className={onb.error}>{te(error)}</div>}
    </div>
  );
}
