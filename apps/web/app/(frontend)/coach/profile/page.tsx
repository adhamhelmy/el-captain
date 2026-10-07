'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LocaleSetting } from '@/components/LocaleToggle';
import { PasswordSetting } from '@/components/PasswordSetting';
import { ThemeSetting } from '@/components/ThemeToggle';
import { Avatar, Field, Toggle } from '@/components/ui';
import { isolate } from '@/i18n/locale';
import { CATEGORIES, coach, ME } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';
import profile from '../../profile.module.css';
import settings from '@/components/settings.module.css';
import styles from './page.module.css';

export default function CoachProfilePage() {
  const t = useTranslations('coachEdit');
  const tp = useTranslations('profile');
  const tc = useTranslations('common');
  const x = useSessionText();
  const me = coach(ME.coach)!;
  const [form, setForm] = useState({
    name: x.name(me),
    specialty: me.specialty,
    location: me.location,
    rate: String(me.rate),
    bio: me.bio,
    email: me.email,
    payout: 'Chase •••• 4821',
  });
  const [notify, setNotify] = useState(true);
  const [saved, setSaved] = useState(false);

  const input = (key: keyof typeof form) => ({
    className: 'input',
    value: form[key],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      setForm({ ...form, [key]: e.target.value });
      setSaved(false);
    },
  });

  return (
    <div className={`page stack ${profile.page} ${styles.page}`}>
      <div className='title'>{tp('title')}</div>
      <div className={`card stack ${profile.card}`}>
        <div className={`${profile.head} ${styles.head}`}>
          <Avatar initials={x.initials(me)} size={64} accent />
          <div className={styles.headText}>
            <div dir='auto' className={profile.name}>
              {form.name}
            </div>
            <div className={`muted ${profile.meta}`}>
              {t('line', { specialty: x.category(form.specialty), location: isolate(form.location) })}
            </div>
          </div>
        </div>
        <div className={`fields ${profile.fields}`}>
          <Field label={t('displayName')}>
            <input {...input('name')} />
          </Field>
          <Field label={t('specialty')}>
            <select {...input('specialty')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {x.category(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('location')}>
            <input {...input('location')} />
          </Field>
          <Field label={t('rate')}>
            <input {...input('rate')} />
          </Field>
        </div>
        <Field label={t('bio')}>
          <textarea rows={4} {...input('bio')} className={`input ${profile.multiline}`} />
        </Field>
      </div>
      <div className={`card stack ${profile.card}`}>
        <div className='h3'>{t('account')}</div>
        <div className='fields'>
          <Field label={tc('email')}>
            <input {...input('email')} dir='ltr' />
          </Field>
          <Field label={t('payout')}>
            <input {...input('payout')} dir='ltr' />
          </Field>
        </div>
        <div className='setting'>
          <div>
            <div className={settings.label}>{t('notifications')}</div>
            <div className={`muted ${settings.hint}`}>
              {t('notificationsHint')}
            </div>
          </div>
          <Toggle
            on={notify}
            onChange={(v) => {
              setNotify(v);
              setSaved(false);
            }}
          />
        </div>
        <PasswordSetting />
        <ThemeSetting />
        <LocaleSetting />
      </div>
      <div className={profile.actions}>
        <button
          type='button'
          className={`btn ${profile.save}`}
          onClick={() => setSaved(true)}
        >
          {tc('save')}
        </button>
        {saved && <span className={profile.saved}>{tc('saved')}</span>}
      </div>
    </div>
  );
}
