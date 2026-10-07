'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { registerLink } from '@/components/rich';
import { Field } from '@/components/ui';
import { normalizeEmail } from '@/lib/auth-rules';
import { ERROR_CODES } from '@/lib/error-codes';
import { canAccess, homeForRole } from '@/lib/routes';
import { ResendVerification } from '../ResendVerification';
import styles from '../auth.module.css';

export default function LoginPage() {
  const t = useTranslations('login');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const router = useRouter();
  const callbackUrl = useSearchParams().get('callbackUrl');
  const [error, setError] = useState<'' | 'invalidLogin' | 'emailNotVerified'>('');
  const [email, setEmail] = useState('');

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const address = normalizeEmail(form.get('email'));
    setEmail(address);
    const res = await signIn('credentials', {
      redirect: false,
      email: address,
      password: form.get('password'),
    });
    if (res?.error) return setError(res.error === ERROR_CODES.EMAIL_NOT_VERIFIED ? 'emailNotVerified' : 'invalidLogin');
    const role = (await getSession())?.user?.role;
    // Only same-origin paths ("//host" would be an open redirect) the role can actually open.
    const safe =
      callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') && canAccess(role, callbackUrl);
    router.push(safe ? callbackUrl! : homeForRole(role));
  }

  return (
    <form onSubmit={submit} className={`stack ${styles.form}`}>
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
      <div>
        <div className={styles.passwordHead}>
          <span className='muted'>{tc('password')}</span>
          <Link href='/forgot-password'>{t('forgot')}</Link>
        </div>
        <input
          name='password'
          type='password'
          dir='ltr'
          required
          placeholder='••••••••'
          className='input on-page'
        />
      </div>
      {error && <div className={styles.error}>{te(error)}</div>}
      {error === 'emailNotVerified' && (
        <ResendVerification key={email} email={email} label={t('resend')} sentLabel={t('resent')} />
      )}
      <button type='submit' className='btn block'>
        {tc('logIn')}
      </button>
      <div className={`muted ${styles.foot}`}>
        {t.rich('newHere', { link: registerLink })}
      </div>
    </form>
  );
}
