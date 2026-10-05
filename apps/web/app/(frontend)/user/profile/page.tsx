'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LocaleSetting } from '@/components/LocaleToggle';
import { ThemeSetting } from '@/components/ThemeToggle';
import { Avatar, Field, Toggle } from '@/components/ui';
import { CATEGORIES, ME, user, type Category } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';

export default function UserProfilePage() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const x = useSessionText();
  const me = user(ME.user)!;
  const [form, setForm] = useState({ name: me.name, email: me.email, phone: me.phone });
  const [favs, setFavs] = useState<Category[]>(['yoga', 'spin']);
  const [reminders, setReminders] = useState(true);
  const [saved, setSaved] = useState(false);

  const edit = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    setSaved(false);
  };
  const toggleFav = (c: Category) => {
    setFavs(favs.includes(c) ? favs.filter((f) => f !== c) : [...favs, c]);
    setSaved(false);
  };

  return (
    <div className='page stack' style={{ maxWidth: 720, gap: 24 }}>
      <div className='title'>{t('title')}</div>
      <div className='card stack' style={{ gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar initials={me.initials} size={64} fontSize={22} accent />
          <div>
            <div dir='auto' style={{ fontWeight: 700, fontSize: 19 }}>
              {form.name}
            </div>
            <div className='muted' style={{ fontSize: 14 }}>
              {t('memberSince', { date: x.monthYear(me.joined) })}
            </div>
          </div>
        </div>
        <div className='fields' style={{ paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          <Field label={tc('fullName')}>
            <input
              className='input'
              value={form.name}
              onChange={(e) => edit({ name: e.target.value })}
            />
          </Field>
          <Field label={tc('email')}>
            <input
              className='input'
              dir='ltr'
              value={form.email}
              onChange={(e) => edit({ email: e.target.value })}
            />
          </Field>
          <Field label={t('phone')}>
            <input
              className='input'
              dir='ltr'
              value={form.phone}
              onChange={(e) => edit({ phone: e.target.value })}
            />
          </Field>
        </div>
        <div>
          <div className='label' style={{ marginBottom: 10 }}>
            {t('favourites')}
          </div>
          <div className='chips'>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type='button'
                className={favs.includes(c) ? 'chip on' : 'chip'}
                onClick={() => toggleFav(c)}
              >
                {x.category(c)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className='card stack' style={{ gap: 18 }}>
        <div className='h3'>{t('settings')}</div>
        <ThemeSetting />
        <LocaleSetting />
        <div className='setting'>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t('reminders')}</div>
            <div className='muted' style={{ fontSize: 13 }}>
              {t('remindersHint')}
            </div>
          </div>
          <Toggle
            on={reminders}
            onChange={(v) => {
              setReminders(v);
              setSaved(false);
            }}
          />
        </div>
        <div className='setting'>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{tc('password')}</div>
            <div className='muted' style={{ fontSize: 13 }}>
              {t('passwordHint')}
            </div>
          </div>
          <Link
            href='/reset-password'
            className='btn-ghost sm plain'
            style={{ padding: '9px 14px' }}
          >
            {tc('change')}
          </Link>
        </div>
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
