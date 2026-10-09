'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { registerLink } from '@/components/rich';
import { Field } from '@/components/ui';
import { normalizeEmail } from '@/lib/shared/auth-rules';
import { ERROR_CODES, signInError, type SignInError } from '@/lib/shared/error-codes';
import { canAccess, homeForRole } from '@/lib/shared/routes';
import { ResendVerification } from '../ResendVerification';
import styles from '../auth.module.css';

export default function LoginPage() {
  const t = useTranslations('login');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl');
  const suspendedNow = params.get('error') === ERROR_CODES.ACCOUNT_SUSPENDED;
  const [error, setError] = useState<'' | SignInError>(suspendedNow ? 'accountSuspended' : '');
  const [email, setEmail] = useState('');

  // Sent here because the account was suspended while signed in: end that session.
  useEffect(() => {
    if (suspendedNow) signOut({ redirect: false });
  }, [suspendedNow]);

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
    if (res?.error) return setError(signInError(res.error));
    const { role, coachStatus } = (await getSession())?.user ?? {};
    // Only same-origin paths ("//host" would be an open redirect) the role can actually open.
    const safe = callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') && canAccess(role, callbackUrl, coachStatus);
    router.push(safe ? callbackUrl! : homeForRole(role, coachStatus));
  }

  return (
    <form method='post' onSubmit={submit} className={`stack ${styles.form}`}>
      <div>
        <div className='auth-title'>{t('title')}</div>
        <div className={`muted ${styles.sub}`}>{t('sub')}</div>
      </div>
      <Field label={tc('email')}>
        <input name='email' type='email' dir='ltr' required placeholder='you@example.com' className='input on-page' />
      </Field>
      <div>
        <div className={styles.passwordHead}>
          <span className='muted'>{tc('password')}</span>
          <Link href='/forgot-password'>{t('forgot')}</Link>
        </div>
        <input name='password' type='password' dir='ltr' required placeholder='••••••••' className='input on-page' />
      </div>
      {error && <div className={styles.error}>{te(error)}</div>}
      {error === 'emailNotVerified' && <ResendVerification key={email} email={email} label={t('resend')} sentLabel={t('resent')} />}
      <button type='submit' className='btn block'>
        {tc('logIn')}
      </button>
      <div className={`muted ${styles.foot}`}>{t.rich('newHere', { link: registerLink })}</div>
    </form>
  );
}
