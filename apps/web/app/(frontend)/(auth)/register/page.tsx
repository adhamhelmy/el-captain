'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { loginLink } from '@/components/rich';
import { Field } from '@/components/ui';
import type { Messages } from '@/i18n/messages';
import { register } from '@/lib/auth-api';
import { isStrongPassword, isValidEmail, normalizeEmail } from '@/lib/auth-rules';
import { pickError, REGISTER_ERRORS } from '@/lib/error-codes';
import { ResendVerification } from '../ResendVerification';
import styles from '../auth.module.css';

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
      className={on ? `${styles.role} ${styles.on}` : styles.role}
    >
      <div className={styles.roleTitle}>{title}</div>
      <div className={styles.roleSub}>{sub}</div>
    </button>
  );
}

export default function RegisterPage() {
  const t = useTranslations('register');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const [role, setRole] = useState(useSearchParams().get('role') === 'coach' ? 'coach' : 'user');
  const [error, setError] = useState<keyof Messages['errors'] | ''>('');
  const [sentTo, setSentTo] = useState('');

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const { confirmPassword, ...form } = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const email = normalizeEmail(form.email);
    if (!isValidEmail(email)) return setError('invalid_email');
    if (!isStrongPassword(form.password)) return setError('weak_password');
    if (form.password !== confirmPassword) return setError('passwordsDontMatch');
    const res = await register({ ...form, email, role: role === 'coach' ? 'COACH' : 'USER' });
    if (!res.ok) return setError(pickError(REGISTER_ERRORS, res.code));
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <div className={`stack ${styles.done}`}>
        <div className='auth-title'>{t('checkTitle')}</div>
        <div dir='auto' className={`muted ${styles.text}`}>
          {t('checkText', { email: sentTo })}
        </div>
        <ResendVerification email={sentTo} label={t('resend')} sentLabel={t('resent')} />
        <div className={`muted ${styles.foot}`}>
          {t.rich('haveAccount', { link: loginLink })}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`stack ${styles.form}`}>
      <div>
        <div className='auth-title'>{t('title')}</div>
        <div className={`muted ${styles.sub}`}>
          {t('sub')}
        </div>
      </div>
      <div className={styles.roles}>
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
          dir='ltr'
          required
          autoComplete='new-password'
          placeholder={t('passwordPlaceholder')}
          className='input on-page'
          onChange={() => setError('')}
        />
      </Field>
      <Field label={t('confirmPassword')}>
        <input
          name='confirmPassword'
          type='password'
          dir='ltr'
          required
          autoComplete='new-password'
          className='input on-page'
          onChange={() => setError('')}
        />
      </Field>
      {role === 'coach' && (
        <div className={styles.notice}>{t('coachNotice')}</div>
      )}
      {error && <div className={styles.error}>{te(error)}</div>}
      <button type='submit' className='btn block'>
        {t('submit')}
      </button>
      <div className={`muted ${styles.foot}`}>
        {t.rich('haveAccount', { link: loginLink })}
      </div>
    </form>
  );
}
