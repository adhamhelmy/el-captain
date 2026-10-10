'use client';
import { useEffect, useState } from 'react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { LocaleSetting } from '@/components/LocaleToggle';
import { PasswordSetting } from '@/components/PasswordSetting';
import { ThemeSetting } from '@/components/ThemeToggle';
import { Avatar, Field, initialsOf } from '@/components/ui';
import { searchSports } from '@/lib/client/coach-api';
import { getMe, saveMe } from '@/lib/client/member-api';
import type { MemberDTO, SportDTO } from '@/lib/server/dto';
import { NAME_MAX, sportName } from '@/lib/shared/coach-rules';
import { cleanPhone, MAX_FAVOURITE_SPORTS } from '@/lib/shared/member-rules';
import onb from '@/components/onboarding.module.css';
import profile from '../../profile.module.css';
import styles from './page.module.css';

export default function UserProfilePage() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const f = useFormatter();
  const locale = useLocale();
  const [me, setMe] = useState<MemberDTO | null>(null);
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [favs, setFavs] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMe()
      .then((r) => {
        if (!r.ok) return setError(te('generic'));
        setMe(r.data);
        setForm({ name: r.data.name, phone: r.data.phone ?? '' });
        setFavs(r.data.sports.map((s) => s.id));
      })
      .catch(() => setError(te('generic')));
    searchSports('')
      .then((r) => r.ok && setSports(r.data))
      .catch(() => setSports([]));
  }, [te]);

  const nameMissing = !form.name.trim();
  const phoneInvalid = form.phone.trim() !== '' && !cleanPhone(form.phone);

  const edit = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    setSaved(false);
  };
  const toggleFav = (id: string) => {
    if (!favs.includes(id) && favs.length >= MAX_FAVOURITE_SPORTS) return setError(t('favouritesMax', { max: MAX_FAVOURITE_SPORTS }));
    setFavs(favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id]);
    setSaved(false);
    setError('');
  };

  async function save() {
    setSaved(false);
    if (nameMissing || phoneInvalid) return setError(t('fixFields'));
    setBusy(true);
    setError('');
    const res = await saveMe({ name: form.name.trim(), phone: form.phone.trim() || null, sportIds: favs });
    setBusy(false);
    if (!res.ok) return setError(te(res.code === 'invalid_profile' ? 'invalid_profile' : 'generic'));
    setMe(res.data);
    setForm({ name: res.data.name, phone: res.data.phone ?? '' });
    setSaved(true);
  }

  // The form only appears once the profile has loaded, so nothing typed earlier gets overwritten.
  if (!me) {
    return (
      <div className={`page stack ${profile.page} ${styles.page}`}>
        <div className='title'>{t('title')}</div>
        {error && <div className={onb.error}>{error}</div>}
      </div>
    );
  }

  return (
    <div className={`page stack ${profile.page} ${styles.page}`}>
      <div className='title'>{t('title')}</div>
      <div className={`card stack ${profile.card}`}>
        <div className={profile.head}>
          <Avatar initials={initialsOf(form.name || me.name)} size={64} accent />
          <div>
            <div dir='auto' className={profile.name}>
              {form.name}
            </div>
            <div className={`muted ${profile.meta}`}>
              {t('memberSince', { date: f.dateTime(new Date(me.createdAt), { month: 'long', year: 'numeric' }) })}
            </div>
          </div>
        </div>
        <div className={`fields ${profile.fields}`}>
          <Field label={tc('fullName')}>
            <input className='input' dir='auto' maxLength={NAME_MAX} value={form.name} onChange={(e) => edit({ name: e.target.value })} />
            {nameMissing && <div className={onb.error}>{t('nameRequired')}</div>}
          </Field>
          <Field label={tc('email')}>
            <input className='input' dir='ltr' value={me.email} readOnly disabled />
            <div className={`muted ${onb.hint}`}>{t('emailLocked')}</div>
          </Field>
          <Field label={t('phone')}>
            <input
              className='input'
              dir='ltr'
              type='tel'
              inputMode='tel'
              placeholder='+20 100 123 4567'
              value={form.phone}
              onChange={(e) => edit({ phone: e.target.value })}
            />
            <div className={phoneInvalid ? onb.error : `muted ${onb.hint}`}>{phoneInvalid ? t('phoneInvalid') : t('phoneHint')}</div>
          </Field>
        </div>
        <div>
          <div className={`label ${styles.favouritesLabel}`}>
            {t('favourites')} <span className='muted'>{t('favouritesCount', { count: favs.length, max: MAX_FAVOURITE_SPORTS })}</span>
          </div>
          <div className='chips'>
            {sports.map((s) => (
              <button
                key={s.id}
                type='button'
                className={favs.includes(s.id) ? 'chip on' : 'chip'}
                aria-pressed={favs.includes(s.id)}
                onClick={() => toggleFav(s.id)}
              >
                {sportName(s, locale)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className={`card stack ${profile.card}`}>
        <div className='h3'>{t('settings')}</div>
        <ThemeSetting />
        <LocaleSetting />
        <PasswordSetting />
      </div>
      <div className={profile.actions}>
        <button type='button' className={`btn ${profile.save}`} disabled={busy} onClick={save}>
          {tc('save')}
        </button>
        {saved && <span className={profile.saved}>{tc('saved')}</span>}
        {error && <span className={onb.error}>{error}</span>}
      </div>
    </div>
  );
}
