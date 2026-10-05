'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { loginLink } from '@/components/rich';
import { Field } from '@/components/ui';
import type { Messages } from '@/i18n/messages';

type ErrorKey = keyof Messages['errors'];
const API_ERRORS = new Set<string>(['missing_fields', 'invalid_role', 'email_taken']);

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
        textAlign: 'start',
        padding: 14,
        borderRadius: 10,
        border: `1px solid ${on ? 'var(--hover-border)' : 'var(--border)'}`,
        background: on ? 'var(--accent-tint)' : 'var(--surface)',
        color: on ? 'var(--accent-text)' : 'var(--text-2)',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.75 }}>{sub}</div>
    </button>
  );
}

export default function RegisterPage() {
  const t = useTranslations('register');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const router = useRouter();
  const [role, setRole] = useState(useSearchParams().get('role') === 'coach' ? 'coach' : 'user');
  const [error, setError] = useState<ErrorKey | ''>('');

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    if (form.password.length < 8) return setError('passwordTooShort');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role: role === 'coach' ? 'COACH' : 'USER' }),
    });
    if (!res.ok) {
      const code = (await res.json().catch(() => ({}))).code;
      return setError(API_ERRORS.has(code) ? (code as ErrorKey) : 'generic');
    }
    const login = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    if (login?.error) return setError('signInAfterRegister');
    router.push(role === 'coach' ? '/coach/profile' : '/user/dashboard');
  }

  return (
    <form onSubmit={submit} className='stack' style={{ gap: 18 }}>
      <div>
        <div className='auth-title'>{t('title')}</div>
        <div className='muted' style={{ fontSize: 15, marginTop: 6 }}>
          {t('sub')}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <RoleCard
          on={role === 'user'}
          title={t('roleUser.title')}
          sub={t('roleUser.sub')}
          onClick={() => setRole('user')}
        />
        <RoleCard
          on={role === 'coach'}
          title={t('roleCoach.title')}
          sub={t('roleCoach.sub')}
          onClick={() => setRole('coach')}
        />
      </div>
      <Field label={tc('fullName')}>
        <input name='name' required placeholder={t('namePlaceholder')} className='input on-page' />
      </Field>
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
      <Field label={tc('password')}>
        <input
          name='password'
          type='password'
          required
          placeholder={t('passwordPlaceholder')}
          className='input on-page'
        />
      </Field>
      {role === 'coach' && (
        <div
          style={{
            background: 'var(--pending-tint)',
            border: '1px solid var(--pending-border)',
            color: 'var(--pending)',
            fontSize: 13,
            lineHeight: 1.5,
            padding: '12px 14px',
            borderRadius: 8,
          }}
        >
          {t('coachNotice')}
        </div>
      )}
      {error && <div style={{ color: 'var(--warn)', fontSize: 13 }}>{te(error)}</div>}
      <button type='submit' className='btn block'>
        {t('submit')}
      </button>
      <div className='muted' style={{ fontSize: 14, textAlign: 'center' }}>
        {t.rich('haveAccount', { link: loginLink })}
      </div>
    </form>
  );
}
