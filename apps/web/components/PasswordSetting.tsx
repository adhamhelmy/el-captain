'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/ui';
import type { Messages } from '@/i18n/messages';
import { changePassword } from '@/lib/client/auth-api';
import { isStrongPassword } from '@/lib/shared/auth-rules';
import { CHANGE_PASSWORD_ERRORS, pickError } from '@/lib/shared/error-codes';
import settings from './settings.module.css';

/** Profile settings row that opens a form to change the signed-in user's password. */
export function PasswordSetting() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const tr = useTranslations('reset');
  const te = useTranslations('errors');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<keyof Messages['errors'] | ''>('');
  const [done, setDone] = useState(false);

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = Object.fromEntries(new FormData(formEl)) as Record<string, string>;
    if (!isStrongPassword(form.newPassword)) return setError('weak_password');
    if (form.newPassword !== form.confirmPassword) return setError('passwordsDontMatch');
    const res = await changePassword(form.currentPassword, form.newPassword);
    if (!res.ok) return setError(pickError(CHANGE_PASSWORD_ERRORS, res.code));
    formEl.reset();
    setOpen(false);
    setDone(true);
  }

  return (
    <div className={`stack ${settings.password}`}>
      <div className='setting'>
        <div>
          <div className={settings.label}>{tc('password')}</div>
          <div className={`muted ${settings.hint}`}>{done ? t('passwordUpdated') : t('passwordHint')}</div>
        </div>
        <button
          type='button'
          className={`btn-ghost sm ${settings.change}`}
          onClick={() => {
            setOpen(!open);
            setError('');
            setDone(false);
          }}
        >
          {open ? tc('cancel') : tc('change')}
        </button>
      </div>
      {open && (
        <form method='post' onSubmit={submit} onChange={() => setError('')} className={`stack ${settings.form}`}>
          <Field label={t('currentPassword')}>
            <input name='currentPassword' type='password' dir='ltr' required autoComplete='current-password' className='input' />
          </Field>
          <Field label={tr('newPassword')}>
            <input name='newPassword' type='password' dir='ltr' required autoComplete='new-password' className='input' />
          </Field>
          <Field label={tr('confirm')}>
            <input name='confirmPassword' type='password' dir='ltr' required autoComplete='new-password' className='input' />
          </Field>
          {error && <div className={settings.error}>{te(error)}</div>}
          <button type='submit' className='btn'>
            {t('updatePassword')}
          </button>
        </form>
      )}
    </div>
  );
}
