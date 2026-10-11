'use client';
import { useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { addCertification, certificationFileUrl, removeCertification, type Certification } from '@/lib/client/coach-api';
import { CERT_TITLE_MAX, MAX_CERTS, UPLOAD_RULES } from '@/lib/shared/coach-rules';
import { uploadFile } from '@/lib/client/upload';
import { accent } from './rich';
import styles from './onboarding.module.css';

const KNOWN_ERRORS = ['invalid_upload', 'invalid_profile', 'profile_locked'] as const;
type KnownError = (typeof KNOWN_ERRORS)[number];
const errorKey = (code?: string): KnownError | 'generic' => (KNOWN_ERRORS.includes(code as KnownError) ? (code as KnownError) : 'generic');

/** The certificate's name, from its file name without the extension. */
const titleOf = (fileName: string) =>
  fileName
    .replace(/\.[^.]+$/, '')
    .trim()
    .slice(0, CERT_TITLE_MAX) || fileName.slice(0, CERT_TITLE_MAX);
/** The badge on each row: PDF, JPG, PNG… */
const badgeOf = (c: Certification) => (c.contentType === 'application/pdf' ? 'PDF' : (c.fileName.split('.').pop() ?? '').toUpperCase().slice(0, 4));

/** Uploaded certificates. Each change is saved right away, since the files already live in storage. */
export function CertificationList({
  coachId,
  items,
  onChange,
  readOnly,
}: Readonly<{ coachId: string; items: Certification[]; onChange?: (c: Certification[]) => void; readOnly?: boolean }>) {
  const t = useTranslations('onboarding');
  const te = useTranslations('errors');
  const f = useFormatter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState('');

  /** Uploads one file after another, so the list grows in the order they were picked. */
  async function upload(files: File[]) {
    setBusy(true);
    setError('');
    let list = items;
    for (const file of files.slice(0, MAX_CERTS - items.length)) {
      const up = await uploadFile('certificate', coachId, file);
      const saved = up.ok ? await addCertification(coachId, { title: titleOf(file.name), filePath: up.path, fileName: file.name }) : up;
      if (!saved.ok) {
        setError(te(errorKey(saved.code)));
        break;
      }
      list = [...list, saved.data];
      onChange?.(list);
    }
    setBusy(false);
  }

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (files.length) upload(files);
  }

  function drop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    const files = [...e.dataTransfer.files];
    if (files.length && !busy) upload(files);
  }

  async function remove(id: string) {
    const res = await removeCertification(coachId, id);
    if (res.ok) onChange?.(items.filter((c) => c.id !== id));
    else setError(te(errorKey(res.code)));
  }

  return (
    <div className={styles.list}>
      {!readOnly && items.length < MAX_CERTS && (
        <button
          type='button'
          className={`${styles.dropZone} ${over ? styles.dropOver : ''}`}
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={drop}
        >
          <span className={styles.dropTitle}>{busy ? t('uploading') : t.rich('dropFiles', { browse: accent })}</span>
          <span className={styles.photoHint}>{t('certLimits', { count: items.length, max: MAX_CERTS })}</span>
        </button>
      )}
      <input ref={input} type='file' hidden multiple accept={UPLOAD_RULES.certificate.types.join(',')} onChange={pick} />
      {items.map((c) => (
        <div key={c.id} className={styles.cert}>
          <span className={styles.certBadge}>{badgeOf(c)}</span>
          <span className={styles.certText}>
            <span dir='auto' className={styles.certName}>
              {c.title}
            </span>
            <span className={styles.certMeta}>{f.number(c.size / 1024 / 1024, { maximumFractionDigits: 1 })} MB</span>
          </span>
          <a className={styles.textBtn} href={certificationFileUrl(coachId, c.id)} target='_blank' rel='noopener noreferrer'>
            {t('view')}
          </a>
          {!readOnly && (
            <button type='button' className={styles.textBtn} onClick={() => remove(c.id)}>
              {t('remove')}
            </button>
          )}
        </div>
      ))}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
