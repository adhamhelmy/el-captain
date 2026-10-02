'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Field } from '@/components/ui';

function RoleCard({
  on,
  title,
  sub,
  onClick,
}: Readonly<{ on: boolean; title: string; sub: string; onClick: () => void }>) {
  return (
    <button
      type='button'
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: 14,
        borderRadius: 10,
        border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
        background: on ? 'rgba(215,255,61,0.1)' : 'var(--surface)',
        color: on ? 'var(--accent)' : 'var(--text-2)',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.75 }}>{sub}</div>
    </button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState(useSearchParams().get('role') === 'coach' ? 'coach' : 'user');
  const [error, setError] = useState('');

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role: role === 'coach' ? 'COACH' : 'USER' }),
    });
    if (!res.ok)
      return setError((await res.json().catch(() => ({}))).error ?? 'Something went wrong.');
    const login = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    if (login?.error) return setError('Account created, but signing in failed. Try logging in.');
    router.push(role === 'coach' ? '/coach/profile' : '/user/dashboard');
  }

  return (
    <form onSubmit={submit} className='stack' style={{ gap: 18 }}>
      <div>
        <div className='auth-title'>CREATE ACCOUNT</div>
        <div className='muted' style={{ fontSize: 15, marginTop: 6 }}>
          Takes less than a minute.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <RoleCard
          on={role === 'user'}
          title='I want to train'
          sub='Book sessions'
          onClick={() => setRole('user')}
        />
        <RoleCard
          on={role === 'coach'}
          title="I'm a coach"
          sub='Run sessions'
          onClick={() => setRole('coach')}
        />
      </div>
      <Field label='Full name'>
        <input name='name' required placeholder='Jordan Lee' className='input on-page' />
      </Field>
      <Field label='Email'>
        <input
          name='email'
          type='email'
          required
          placeholder='you@example.com'
          className='input on-page'
        />
      </Field>
      <Field label='Password'>
        <input
          name='password'
          type='password'
          required
          placeholder='At least 8 characters'
          className='input on-page'
        />
      </Field>
      {role === 'coach' && (
        <div
          style={{
            background: 'rgba(255,197,61,0.1)',
            border: '1px solid rgba(255,197,61,0.3)',
            color: 'var(--pending)',
            fontSize: 13,
            lineHeight: 1.5,
            padding: '12px 14px',
            borderRadius: 8,
          }}
        >
          Coach accounts are reviewed before your sessions go live, usually within two business
          days.
        </div>
      )}
      {error && <div style={{ color: 'var(--warn)', fontSize: 13 }}>{error}</div>}
      <button type='submit' className='btn block'>
        Create account
      </button>
      <div className='muted' style={{ fontSize: 14, textAlign: 'center' }}>
        Already have an account? <Link href='/login'>Log in</Link>
      </div>
    </form>
  );
}
