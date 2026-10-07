'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/ui';
import type { Messages } from '@/i18n/messages';
import { resetPassword } from '@/lib/auth-api';
import { isStrongPassword } from '@/lib/auth-rules';
import { ERROR_CODES, pickError, RESET_PASSWORD_ERRORS } from '@/lib/error-codes';
import styles from '../auth.module.css';

/** Opened from the reset email: /reset-password?token=… */
export default function ResetPasswordPage() {
  const t = useTranslations('reset');
  const te = useTranslations('errors');
  const token = useSearchParams().get('token');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState<keyof Messages['errors'] | ''>(token ? '' : ERROR_CODES.INVALID_TOKEN);
  const [done, setDone] = useState(false);

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isStrongPassword(pw)) return setError('weak_password');
    if (pw !== pw2) return setError('passwordsDontMatch');
    if (!token) return;
    const res = await resetPassword(token, pw);
    if (!res.ok) return setError(pickError(RESET_PASSWORD_ERRORS, res.code));
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
          dir='ltr'
          required
          autoComplete='new-password'
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
          dir='ltr'
          required
          autoComplete='new-password'
          value={pw2}
          onChange={(e) => {
            setPw2(e.target.value);
            setError('');
          }}
          className='input on-page'
        />
      </Field>
      {error && <div className={styles.error}>{te(error)}</div>}
      {error === ERROR_CODES.INVALID_TOKEN && (
        <Link href='/forgot-password' className={`muted ${styles.foot}`}>
          {t('requestNew')}
        </Link>
      )}
      <button type='submit' className='btn block' disabled={!token}>
        {t('submit')}
      </button>
    </form>
  );
}
