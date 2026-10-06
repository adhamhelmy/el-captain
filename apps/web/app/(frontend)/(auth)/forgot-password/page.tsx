'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/ui';
import styles from '../auth.module.css';

// Mock until wired up: call POST /api/auth/forgot-password once it exists.
export default function ForgotPasswordPage() {
  const t = useTranslations('forgot');
  const tc = useTranslations('common');
  const [sent, setSent] = useState(false);
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
        <form
          className={`stack ${styles.form}`}
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <div>
            <div className='auth-title'>{t('title')}</div>
            <div className={`muted ${styles.sub}`}>
              {t('sub')}
            </div>
          </div>
          <Field label={tc('email')}>
            <input type='email' dir='ltr' required placeholder='you@example.com' className='input on-page' />
          </Field>
          <button type='submit' className='btn block'>
            {t('submit')}
          </button>
        </form>
      )}
    </div>
  );
}
