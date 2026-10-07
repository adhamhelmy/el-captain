'use client';
import { useState } from 'react';
import { resendVerification } from '@/lib/auth-api';
import styles from './auth.module.css';

/** Asks for a new confirmation link, then says it went out. The API answers the same for any email. */
export function ResendVerification({ email, label, sentLabel }: Readonly<{ email: string; label: string; sentLabel: string }>) {
  const [sent, setSent] = useState(false);

  async function resend() {
    await resendVerification(email);
    setSent(true);
  }

  if (sent) return <div className={`muted ${styles.foot}`}>{sentLabel}</div>;
  return (
    <button type='button' className={`btn-ghost sm ${styles.resend}`} onClick={resend}>
      {label}
    </button>
  );
}
