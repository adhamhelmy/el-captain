'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { CertificationList } from '@/components/CertificationList';
import { LinksEditor, toLinks, type LinkDraft } from '@/components/LinksEditor';
import { LocaleSetting } from '@/components/LocaleToggle';
import { PasswordSetting } from '@/components/PasswordSetting';
import { PhotoUpload } from '@/components/PhotoUpload';
import { SportPicker } from '@/components/SportPicker';
import { ThemeSetting } from '@/components/ThemeToggle';
import { Avatar, Field } from '@/components/ui';
import { getOnboarding, saveProfile, type Certification } from '@/lib/coach-api';
import { BIO_MAX, CITY_MAX, sportName } from '@/lib/coach-rules';
import type { CoachDTO, SportDTO } from '@/lib/dto';
import onb from '@/components/onboarding.module.css';
import profileStyles from '../../profile.module.css';
import styles from './page.module.css';

const SAVE_ERRORS = ['invalid_profile', 'invalid_upload'] as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** A labelled block; not a <label>, since the editors inside hold several controls. */
function Group({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className={`stack ${onb.group}`}>
      <div className='label'>{label}</div>
      {children}
    </div>
  );
}

export default function CoachProfilePage() {
  const t = useTranslations('coachEdit');
  const to = useTranslations('onboarding');
  const tp = useTranslations('profile');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const locale = useLocale();
  const email = useSession().data?.user.email ?? '';
  const [profile, setProfile] = useState<CoachDTO | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [links, setLinks] = useState<LinkDraft[]>([]);
  const [sports, setSports] = useState<SportDTO[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [photo, setPhoto] = useState<{ path: string; url: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const show = (c: CoachDTO) => {
    setProfile(c);
    setName(c.coachName);
    setCity(c.city ?? '');
    setBio(c.bio ?? '');
    setInstagram(c.instagram ?? '');
    setTiktok(c.tiktok ?? '');
    setLinks(c.links.map(({ id, label, url }) => ({ key: id, label, url })));
    setSports(c.sports);
    setCerts(c.certifications);
  };

  useEffect(() => {
    getOnboarding()
      .then((res) => res.ok && show(res.data.coach))
      .catch(() => setProfile(null));
  }, []);

  /** Wraps a setter so any edit clears the "Saved" note. */
  const edit =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setSaved(false);
    };

  async function save() {
    if (!profile) return;
    const res = await saveProfile(profile.id, {
      name,
      city,
      bio,
      instagram,
      tiktok,
      links: toLinks(links),
      sportIds: sports.map((s) => s.id),
      ...(photo && { photoPath: photo.path }),
    });
    if (!res.ok) return setError(te(SAVE_ERRORS.find((c) => c === res.code) ?? 'generic'));
    show(res.data);
    setPhoto(null);
    setError('');
    setSaved(true);
  }

  const photoUrl = photo?.url ?? profile?.photoUrl ?? null;
  const line = [sports.map((s) => sportName(s, locale)).join(' · '), city.trim()].filter(Boolean).join(' · ');

  return (
    <div className={`page stack ${profileStyles.page} ${styles.page}`}>
      <div className='title'>{tp('title')}</div>
      {profile && (
        <div className={`card stack ${profileStyles.card}`}>
          <div className={`${profileStyles.head} ${styles.head}`}>
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- a local preview or a small Blob image
              <img src={photoUrl} alt='' className={`${onb.photo} ${onb.photoSm}`} />
            ) : (
              <Avatar initials={initials(name)} size={64} accent />
            )}
            <div className={styles.headText}>
              <div dir='auto' className={profileStyles.name}>
                {name}
              </div>
              {line && (
                <div dir='auto' className={`muted ${profileStyles.meta}`}>
                  {line}
                </div>
              )}
            </div>
          </div>
          <div className={`fields ${profileStyles.fields}`}>
            <Field label={t('displayName')}>
              <input className='input' dir='auto' value={name} onChange={(e) => edit(setName)(e.target.value)} />
            </Field>
            <Field label={t('location')}>
              <input className='input' dir='auto' maxLength={CITY_MAX} value={city} onChange={(e) => edit(setCity)(e.target.value)} />
            </Field>
          </div>
          <Group label={to('photo')}>
            <PhotoUpload userId={profile.id} url={photoUrl} onUploaded={(path, url) => edit(setPhoto)({ path, url })} />
          </Group>
          <Field label={t('bio')}>
            <textarea
              rows={4}
              dir='auto'
              maxLength={BIO_MAX}
              className={`input ${profileStyles.multiline}`}
              value={bio}
              onChange={(e) => edit(setBio)(e.target.value)}
            />
          </Field>
          <div className='fields'>
            <Field label={to('instagram')}>
              <input className='input' dir='ltr' value={instagram} onChange={(e) => edit(setInstagram)(e.target.value)} />
            </Field>
            <Field label={to('tiktok')}>
              <input className='input' dir='ltr' value={tiktok} onChange={(e) => edit(setTiktok)(e.target.value)} />
            </Field>
          </div>
          <Group label={to('links')}>
            <LinksEditor links={links} onChange={edit(setLinks)} />
          </Group>
          <Group label={to('sports')}>
            <SportPicker selected={sports} onChange={edit(setSports)} />
          </Group>
          <Group label={to('certifications')}>
            <CertificationList coachId={profile.id} items={certs} onChange={setCerts} />
          </Group>
        </div>
      )}
      <div className={`card stack ${profileStyles.card}`}>
        <div className='h3'>{t('account')}</div>
        <Field label={tc('email')}>
          {/* The login email can't be changed here. */}
          <input className='input' dir='ltr' value={email} disabled />
        </Field>
        <PasswordSetting />
        <ThemeSetting />
        <LocaleSetting />
      </div>
      <div className={profileStyles.actions}>
        <button type='button' className={`btn ${profileStyles.save}`} disabled={!profile} onClick={save}>
          {tc('save')}
        </button>
        {saved && <span className={profileStyles.saved}>{tc('saved')}</span>}
        {error && <span className={onb.error}>{error}</span>}
      </div>
    </div>
  );
}
