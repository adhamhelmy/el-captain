'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/ui';

// Mock until wired up: call POST /api/auth/forgot-password once it exists.
export default function ForgotPasswordPage() {
  const t = useTranslations('forgot');
  const tc = useTranslations('common');
  const [sent, setSent] = useState(false);
  return (
    <div className='stack' style={{ gap: 18 }}>
      <Link href='/login' className='muted' style={{ fontSize: 14 }}>
        {t('back')}
      </Link>
      {sent ? (
        <div className='stack' style={{ gap: 14 }}>
          <div className='auth-title'>{t('sentTitle')}</div>
          <div className='muted' style={{ fontSize: 15, lineHeight: 1.6 }}>
            {t('sentText')}
          </div>
        </div>
      ) : (
        <form
          className='stack'
          style={{ gap: 18 }}
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <div>
            <div className='auth-title'>{t('title')}</div>
            <div className='muted' style={{ fontSize: 15, marginTop: 6 }}>
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
