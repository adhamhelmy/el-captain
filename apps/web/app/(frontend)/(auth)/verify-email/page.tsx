'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { verifyEmail } from '@/lib/auth-api';
import styles from '../auth.module.css';

/** Opened from the confirmation email: /verify-email?token=… */
export default function VerifyEmailPage() {
  const t = useTranslations('verify');
  const tc = useTranslations('common');
  const token = useSearchParams().get('token');
  const [state, setState] = useState<'checking' | 'done' | 'failed'>(token ? 'checking' : 'failed');
  // A token works once; Strict Mode runs effects twice in dev, so send it only once.
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    verifyEmail(token).then((res) => setState(res.ok ? 'done' : 'failed'));
  }, [token]);

  if (state === 'checking') return <div className={`muted ${styles.text}`}>{t('checking')}</div>;

  const ok = state === 'done';
  return (
    <div className={`stack ${styles.done}`}>
      <div className='auth-title'>{t(ok ? 'doneTitle' : 'failTitle')}</div>
      <div className={`muted ${styles.text}`}>{t(ok ? 'doneText' : 'failText')}</div>
      <Link href='/login' className='btn block'>
        {tc('logIn')}
      </Link>
    </div>
  );
}
