'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LocaleSetting } from '@/components/LocaleToggle';
import { ThemeSetting } from '@/components/ThemeToggle';
import { Avatar, Field, Toggle } from '@/components/ui';
import { isolate } from '@/i18n/locale';
import { CATEGORIES, coach, ME } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';

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
    <div className='page stack' style={{ maxWidth: 760, gap: 24 }}>
      <div className='title'>{tp('title')}</div>
      <div className='card stack' style={{ gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Avatar initials={x.initials(me)} size={64} fontSize={22} accent />
          <div style={{ flex: 1 }}>
            <div dir='auto' style={{ fontWeight: 700, fontSize: 19 }}>
              {form.name}
            </div>
            <div className='muted' style={{ fontSize: 14 }}>
              {t('line', { specialty: x.category(form.specialty), location: isolate(form.location) })}
            </div>
          </div>
        </div>
        <div className='fields' style={{ paddingTop: 18, borderTop: '1px solid var(--border)' }}>
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
          <textarea rows={4} {...input('bio')} style={{ lineHeight: 1.6, resize: 'vertical' }} />
        </Field>
      </div>
      <div className='card stack' style={{ gap: 18 }}>
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
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t('notifications')}</div>
            <div className='muted' style={{ fontSize: 13 }}>
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
        <ThemeSetting />
        <LocaleSetting />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type='button'
          className='btn'
          style={{ fontSize: 15, padding: '13px 24px' }}
          onClick={() => setSaved(true)}
        >
          {tc('save')}
        </button>
        {saved && <span style={{ color: 'var(--accent-text)', fontSize: 14 }}>{tc('saved')}</span>}
      </div>
    </div>
  );
}
