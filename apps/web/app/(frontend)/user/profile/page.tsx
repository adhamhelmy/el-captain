'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LocaleSetting } from '@/components/LocaleToggle';
import { PasswordSetting } from '@/components/PasswordSetting';
import { ThemeSetting } from '@/components/ThemeToggle';
import { Avatar, Field, Toggle } from '@/components/ui';
import { CATEGORIES, ME, user, type Category } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';
import profile from '../../profile.module.css';
import settings from '@/components/settings.module.css';
import styles from './page.module.css';

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
    <div className={`page stack ${profile.page} ${styles.page}`}>
      <div className='title'>{t('title')}</div>
      <div className={`card stack ${profile.card}`}>
        <div className={profile.head}>
          <Avatar initials={me.initials} size={64} accent />
          <div>
            <div dir='auto' className={profile.name}>
              {form.name}
            </div>
            <div className={`muted ${profile.meta}`}>
              {t('memberSince', { date: x.monthYear(me.joined) })}
            </div>
          </div>
        </div>
        <div className={`fields ${profile.fields}`}>
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
          <div className={`label ${styles.favouritesLabel}`}>
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
      <div className={`card stack ${profile.card}`}>
        <div className='h3'>{t('settings')}</div>
        <ThemeSetting />
        <LocaleSetting />
        <div className='setting'>
          <div>
            <div className={settings.label}>{t('reminders')}</div>
            <div className={`muted ${settings.hint}`}>
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
        <PasswordSetting />
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
