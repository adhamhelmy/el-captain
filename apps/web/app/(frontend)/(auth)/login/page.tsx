'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import { Field } from '@/components/ui';
import { canAccess, homeForRole } from '@/lib/routes';

export default function LoginPage() {
  const router = useRouter();
  const callbackUrl = useSearchParams().get('callbackUrl');
  const [error, setError] = useState('');

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await signIn('credentials', {
      redirect: false,
      email: form.get('email'),
      password: form.get('password'),
    });
    if (res?.error) return setError('Invalid email or password.');
    const role = (await getSession())?.user?.role;
    // Only same-origin paths ("//host" would be an open redirect) the role can actually open.
    const safe =
      callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//') && canAccess(role, callbackUrl);
    router.push(safe ? callbackUrl! : homeForRole(role));
  }

  return (
    <form onSubmit={submit} className='stack' style={{ gap: 18 }}>
      <div>
        <div className='auth-title'>WELCOME BACK</div>
        <div className='muted' style={{ fontSize: 15, marginTop: 6 }}>
          Log in to book and manage your sessions.
        </div>
      </div>
      <Field label='Email'>
        <input
          name='email'
          type='email'
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
          <span className='muted'>Password</span>
          <Link href='/forgot-password'>Forgot password?</Link>
        </div>
        <input
          name='password'
          type='password'
          required
          placeholder='••••••••'
          className='input on-page'
        />
      </div>
      {error && <div style={{ color: 'var(--warn)', fontSize: 13 }}>{error}</div>}
      <button type='submit' className='btn block'>
        Log in
      </button>
      <div className='muted' style={{ fontSize: 14, textAlign: 'center' }}>
        New here? <Link href='/register'>Create an account</Link>
      </div>
    </form>
  );
}
