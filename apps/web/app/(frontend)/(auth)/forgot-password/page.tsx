'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/ui';
import { forgotPassword } from '@/lib/client/auth-api';
import { normalizeEmail } from '@/lib/shared/auth-rules';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const t = useTranslations('forgot');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = normalizeEmail(new FormData(e.currentTarget).get('email'));
    const res = await forgotPassword(email);
    if (!res.ok) return setFailed(true);
    setSent(true);
  }

  return (
    <div className={`stack ${styles.form}`}>
      <Link href='/login' className={`muted ${styles.back}`}>
        {t('back')}
      </Link>
      {sent ? (
        <div className={`stack ${styles.done}`}>
          <div className='auth-title'>{t('sentTitle')}</div>
          <div className={`muted ${styles.text}`}>
            {t('sentText')}
          </div>
        </div>
      ) : (
        <form method='post' className={`stack ${styles.form}`} onSubmit={submit}>
          <div>
            <div className='auth-title'>{t('title')}</div>
            <div className={`muted ${styles.sub}`}>
              {t('sub')}
            </div>
          </div>
          <Field label={tc('email')}>
            <input
              name='email'
              type='email'
              dir='ltr'
              required
              placeholder='you@example.com'
              className='input on-page'
            />
          </Field>
          {failed && <div className={styles.error}>{te('generic')}</div>}
          <button type='submit' className='btn block'>
            {t('submit')}
          </button>
        </form>
      )}
    </div>
  );
}
