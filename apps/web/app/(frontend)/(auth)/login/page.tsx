'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { registerLink } from '@/components/rich';
import { Field } from '@/components/ui';
import { canAccess, homeForRole } from '@/lib/routes';

export default function LoginPage() {
  const t = useTranslations('login');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const router = useRouter();
  const callbackUrl = useSearchParams().get('callbackUrl');
  const [error, setError] = useState(false);

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await signIn('credentials', {
      redirect: false,
      email: form.get('email'),
      password: form.get('password'),
    });
    if (res?.error) return setError(true);
    const role = (await getSession())?.user?.role;
    // Only same-origin paths ("//host" would be an open redirect) the role can actually open.
    const safe =
      callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') && canAccess(role, callbackUrl);
    router.push(safe ? callbackUrl! : homeForRole(role));
  }

  return (
    <form onSubmit={submit} className='stack' style={{ gap: 18 }}>
      <div>
        <div className='auth-title'>{t('title')}</div>
        <div className='muted' style={{ fontSize: 15, marginTop: 6 }}>
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            marginBottom: 6,
          }}
        >
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
      {error && <div style={{ color: 'var(--warn)', fontSize: 13 }}>{te('invalidLogin')}</div>}
      <button type='submit' className='btn block'>
        {tc('logIn')}
      </button>
      <div className='muted' style={{ fontSize: 14, textAlign: 'center' }}>
        {t.rich('newHere', { link: registerLink })}
      </div>
    </form>
  );
}
