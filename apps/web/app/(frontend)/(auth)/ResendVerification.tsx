'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { resendVerification } from '@/lib/client/auth-api';
import styles from './auth.module.css';

/** Asks for a new confirmation link, then says it went out. The API answers the same for any email. */
export function ResendVerification({ email, label, sentLabel }: Readonly<{ email: string; label: string; sentLabel: string }>) {
  const te = useTranslations('errors');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'failed'>('idle');

  async function resend() {
    setState('busy');
    const res = await resendVerification(email);
    setState(res.ok ? 'sent' : 'failed');
  }

  if (state === 'sent') return <div className={`muted ${styles.sent}`}>{sentLabel}</div>;
  return (
    <>
      <button type='button' className='btn-ghost' disabled={state === 'busy'} onClick={resend}>
        {label}
      </button>
      {state === 'failed' && <div className={styles.error}>{te('generic')}</div>}
    </>
  );
}
