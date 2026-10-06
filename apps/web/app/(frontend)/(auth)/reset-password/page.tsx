'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/ui';
import type { Messages } from '@/i18n/messages';
import styles from '../auth.module.css';

// Mock until wired up: call POST /api/auth/reset-password with the token from the URL once it exists.
export default function ResetPasswordPage() {
  const t = useTranslations('reset');
  const te = useTranslations('errors');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState<keyof Messages['errors'] | ''>('');
  const [done, setDone] = useState(false);

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pw.length < 8) return setError('passwordTooShort');
    if (pw !== pw2) return setError('passwordsDontMatch');
    setDone(true);
  }

  if (done) {
    return (
      <div className={`stack ${styles.done}`}>
        <div className='auth-title'>{t('doneTitle')}</div>
        <div className={`muted ${styles.doneText}`}>
          {t('doneText')}
        </div>
        <Link href='/login' className='btn block'>
          {t('goLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`stack ${styles.form}`}>
      <div>
        <div className='auth-title'>{t('title')}</div>
        <div className={`muted ${styles.sub}`}>
          {t('sub')}
        </div>
      </div>
      <Field label={t('newPassword')}>
        <input
          type='password'
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setError('');
          }}
          className='input on-page'
        />
      </Field>
      <Field label={t('confirm')}>
        <input
          type='password'
          value={pw2}
          onChange={(e) => {
            setPw2(e.target.value);
            setError('');
          }}
          className='input on-page'
        />
      </Field>
      {error && <div className={styles.error}>{te(error)}</div>}
      <button type='submit' className='btn block'>
        {t('submit')}
      </button>
    </form>
  );
}
