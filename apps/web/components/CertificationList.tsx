'use client';
import { useRef, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { addCertification, certificationFileUrl, removeCertification, type Certification } from '@/lib/coach-api';
import { CERT_TITLE_MAX, MAX_CERTS, UPLOAD_RULES } from '@/lib/coach-rules';
import { uploadFile } from '@/lib/upload';
import styles from './onboarding.module.css';

const KNOWN_ERRORS = ['invalid_upload', 'invalid_profile', 'profile_locked'] as const;
type KnownError = (typeof KNOWN_ERRORS)[number];
const errorKey = (code?: string): KnownError | 'generic' => (KNOWN_ERRORS.includes(code as KnownError) ? (code as KnownError) : 'generic');

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
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    const up = await uploadFile('certificate', coachId, file);
    const saved = up.ok ? await addCertification(coachId, { title: title.trim(), filePath: up.path, fileName: file.name }) : up;
    setBusy(false);
    if (!saved.ok) return setError(te(errorKey(saved.code)));
    setTitle('');
    onChange?.([...items, saved.data]);
  }

  async function remove(id: string) {
    const res = await removeCertification(coachId, id);
    if (res.ok) onChange?.(items.filter((c) => c.id !== id));
    else setError(te(errorKey(res.code)));
  }

  return (
    <div className={styles.list}>
      {items.map((c) => (
        <div key={c.id} className={styles.cert}>
          <div>
            <div dir='auto'>{c.title}</div>
            <div className={`muted ${styles.certMeta}`}>
              <bdi>{c.fileName}</bdi> · {f.number(c.size / 1024 / 1024, { maximumFractionDigits: 1 })} MB
            </div>
          </div>
          <div className={styles.rowActions}>
            <a className='btn-ghost sm' href={certificationFileUrl(coachId, c.id)} target='_blank' rel='noopener noreferrer'>
              {t('view')}
            </a>
            {!readOnly && (
              <button type='button' className='btn-ghost sm danger' onClick={() => remove(c.id)}>
                {t('remove')}
              </button>
            )}
          </div>
        </div>
      ))}
      {!readOnly && items.length < MAX_CERTS && (
        <div className={styles.certAdd}>
          <input
            className='input'
            dir='auto'
            maxLength={CERT_TITLE_MAX}
            placeholder={t('certTitle')}
            aria-label={t('certTitle')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type='button' className='btn-ghost' disabled={busy || !title.trim()} onClick={() => input.current?.click()}>
            {busy ? t('uploading') : t('addCertification')}
          </button>
          <input ref={input} type='file' hidden accept={UPLOAD_RULES.certificate.types.join(',')} onChange={pick} />
        </div>
      )}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
