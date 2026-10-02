'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Field } from '@/components/ui';

// Mock until wired up: call POST /api/auth/forgot-password once it exists.
export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className='stack' style={{ gap: 18 }}>
      <Link href='/login' className='muted' style={{ fontSize: 14 }}>
        ← Back to log in
      </Link>
      {sent ? (
        <div className='stack' style={{ gap: 14 }}>
          <div className='auth-title'>CHECK YOUR INBOX</div>
          <div className='muted' style={{ fontSize: 15, lineHeight: 1.6 }}>
            If an account exists for that email, a reset link is on its way. It expires in 30
            minutes.
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
            <div className='auth-title'>FORGOT PASSWORD</div>
            <div className='muted' style={{ fontSize: 15, marginTop: 6 }}>
              Enter your email and we’ll send you a reset link.
            </div>
          </div>
          <Field label='Email'>
            <input type='email' required placeholder='you@example.com' className='input on-page' />
          </Field>
          <button type='submit' className='btn block'>
            Send reset link
          </button>
        </form>
      )}
    </div>
  );
}
