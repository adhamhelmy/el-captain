'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Field } from '@/components/ui';

// Mock until wired up: call POST /api/auth/reset-password with the token from the URL once it exists.
export default function ResetPasswordPage() {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pw.length < 8) return setError('Password must be at least 8 characters.');
    if (pw !== pw2) return setError('Passwords don’t match.');
    setDone(true);
  }

  if (done) {
    return (
      <div className='stack' style={{ gap: 14 }}>
        <div className='auth-title'>PASSWORD UPDATED</div>
        <div className='muted' style={{ fontSize: 15 }}>
          You can log in with your new password.
        </div>
        <Link href='/login' className='btn block'>
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className='stack' style={{ gap: 18 }}>
      <div>
        <div className='auth-title'>SET NEW PASSWORD</div>
        <div className='muted' style={{ fontSize: 15, marginTop: 6 }}>
          Choose something at least 8 characters long.
        </div>
      </div>
      <Field label='New password'>
        <input
          type='password'
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setError('');
          }}
          className='input on-page'
        />
      </Field>
      <Field label='Confirm password'>
        <input
          type='password'
          value={pw2}
          onChange={(e) => {
            setPw2(e.target.value);
            setError('');
          }}
          className='input on-page'
        />
      </Field>
      {error && <div style={{ color: 'var(--warn)', fontSize: 13 }}>{error}</div>}
      <button type='submit' className='btn block'>
        Update password
      </button>
    </form>
  );
}
