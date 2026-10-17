'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { CertificationList } from '@/components/CertificationList';
import { CoverUpload } from '@/components/CoverUpload';
import { LinksEditor, toLinks, type LinkDraft } from '@/components/LinksEditor';
import { LocaleChoiceControl } from '@/components/LocaleToggle';
import { MediaList } from '@/components/MediaList';
import { PasswordSetting } from '@/components/PasswordSetting';
import { birthDateInvalid, LanguagePicker, PersonalFields } from '@/components/PersonalFields';
import { PhotoUpload } from '@/components/PhotoUpload';
import { privateBody, privateDraftOf, privateDraftOk, PrivateSessionSettings, type PrivateDraft } from '@/components/PrivateSessionSettings';
import { SportPicker } from '@/components/SportPicker';
import { ThemeChoiceControl } from '@/components/ThemeToggle';
import { Field } from '@/components/ui';
import { getOnboarding, saveProfile, type Certification, type Media } from '@/lib/client/coach-api';
import { listVenues } from '@/lib/client/session-api';
import { BIO_MAX, CITY_MAX, MAX_LINKS, NAME_MAX, socialHandle } from '@/lib/shared/coach-rules';
import type { Gender } from '@/lib/shared/profile-rules';
import type { CoachDTO, SportDTO } from '@/lib/server/dto';
import styles from './page.module.css';

const SAVE_ERRORS = ['invalid_profile', 'invalid_upload'] as const;
const SECTIONS = ['public', 'sports', 'media', 'certifications', 'private', 'locations', 'account'] as const;

/** Everything the save bar tracks; certificates, photos and videos save on their own as each file is added. */
type Form = {
  name: string;
  city: string;
  bio: string;
  instagram: string;
  tiktok: string;
  links: LinkDraft[];
  sports: SportDTO[];
  photo: { path: string; url: string } | null;
  cover: { path: string; url: string } | null;
  private: PrivateDraft;
  birthDate: string;
  gender: Gender | '';
  languages: string[];
};

const formOf = (c: CoachDTO): Form => ({
  name: c.coachName,
  city: c.city ?? '',
  bio: c.bio ?? '',
  instagram: socialHandle('instagram', c.instagram),
  tiktok: socialHandle('tiktok', c.tiktok),
  links: c.links.map(({ id, label, url }) => ({ key: id, label, url })),
  sports: c.sports,
  photo: null,
  cover: null,
  private: privateDraftOf(c.privatePrice, c.privateDuration),
  birthDate: c.birthDate ?? '',
  gender: c.gender ?? '',
  languages: c.languages,
});

/** Compared to spot unsaved changes; row keys and sport details don't count. */
const snapshot = (f: Form) =>
  JSON.stringify({ ...f, links: f.links.map(({ label, url }) => [label, url]), sports: f.sports.map((s) => s.id), photo: f.photo?.path ?? null, cover: f.cover?.path ?? null });

function Section({ id, title, aside, children }: Readonly<{ id: string; title: string; aside?: React.ReactNode; children: React.ReactNode }>) {
  return (
    <section id={id} className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** How many locations the coach has, with a link to manage them on their own page. */
function VenuesLink() {
  const t = useTranslations('venues');
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    listVenues()
      .then((r) => r.ok && setCount(r.data.filter((v) => !v.archived).length))
      .catch(() => setCount(null));
  }, []);
  return (
    <div className={styles.venues}>
      <span className='muted'>{count === null ? '' : t('count', { count })}</span>
      <Link href='/coach/venues' className='btn-ghost sm'>
        {t('manage')}
      </Link>
    </div>
  );
}

export default function CoachProfilePage() {
  const t = useTranslations('coachEdit');
  const to = useTranslations('onboarding');
  const tp = useTranslations('profile');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const email = useSession().data?.user.email ?? '';
  const [profile, setProfile] = useState<CoachDTO | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState('');

  const show = (c: CoachDTO) => {
    setProfile(c);
    setForm(formOf(c));
    setCerts(c.certifications);
    setMedia(c.media);
  };

  useEffect(() => {
    getOnboarding()
      .then((res) => res.ok && show(res.data.coach))
      .catch(() => setProfile(null));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(false), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!profile || !form) return <div className='page' />;

  const set = (patch: Partial<Form>) => {
    setForm((f) => f && { ...f, ...patch });
    setError('');
  };
  const dirty = snapshot(form) !== snapshot(formOf(profile));

  async function save() {
    if (!profile || !form) return;
    if (!privateDraftOk(form.private)) return setError(t('privateRules'));
    if (birthDateInvalid(form.birthDate)) return setError(tp('fixFields'));
    setBusy(true);
    const res = await saveProfile(profile.id, {
      ...privateBody(form.private),
      name: form.name,
      city: form.city,
      bio: form.bio,
      instagram: form.instagram,
      tiktok: form.tiktok,
      links: toLinks(form.links),
      sportIds: form.sports.map((s) => s.id),
      birthDate: form.birthDate || null,
      gender: form.gender || null,
      languages: form.languages,
      ...(form.photo && { photoPath: form.photo.path }),
      ...(form.cover && { coverPath: form.cover.path }),
    });
    setBusy(false);
    if (!res.ok) return setError(te(SAVE_ERRORS.find((c) => c === res.code) ?? 'generic'));
    show(res.data);
    setToast(true);
  }

  const photoUrl = form.photo?.url ?? profile.photoUrl;
  const coverUrl = form.cover?.url ?? profile.coverUrl;

  return (
    <div className={`page ${styles.page}`}>
      <div className='between'>
        <div className='title'>{tp('title')}</div>
        <Link href={`/coaches/${profile.id}`} className='btn-ghost' target='_blank'>
          {t('viewPublic')}
        </Link>
      </div>

      <div className={styles.layout}>
        <nav className={styles.nav} aria-label={t('sections')}>
          {SECTIONS.map((s) => (
            <a key={s} href={`#${s}`}>
              {t(`section.${s}`)}
            </a>
          ))}
        </nav>

        <div className={styles.sections}>
          <Section id='public' title={t('section.public')}>
            <div className={styles.header}>
              <CoverUpload userId={profile.id} url={coverUrl} onUploaded={(path, url) => set({ cover: { path, url } })} />
              <div className={styles.headerPhoto}>
                <PhotoUpload userId={profile.id} url={photoUrl} large ring onUploaded={(path, url) => set({ photo: { path, url } })} />
              </div>
            </div>
            <div className='fields'>
              <Field label={t('displayName')}>
                <input className='input' dir='auto' maxLength={NAME_MAX} value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label={to('address')}>
                <input
                  className='input'
                  dir='auto'
                  maxLength={CITY_MAX}
                  placeholder={to('addressPlaceholder')}
                  value={form.city}
                  onChange={(e) => set({ city: e.target.value })}
                />
              </Field>
            </div>
            <div className={styles.field}>
              <span className={styles.labelRow}>
                <label htmlFor='profile-bio'>{t('bio')}</label>
                <span className={styles.counter}>{to('bioCount', { count: form.bio.trim().length, max: BIO_MAX })}</span>
              </span>
              <textarea
                id='profile-bio'
                rows={4}
                dir='auto'
                maxLength={BIO_MAX}
                className={`input ${styles.multiline}`}
                value={form.bio}
                onChange={(e) => set({ bio: e.target.value })}
              />
            </div>
            <PersonalFields value={form} onChange={({ birthDate, gender }) => set({ birthDate, gender })} hint={tp('personalHintCoach')} />
            <div className={styles.field}>
              <span className={styles.labelRow}>{tp('languages')}</span>
              <LanguagePicker selected={form.languages} onChange={(languages) => set({ languages })} />
            </div>
            <div className='fields'>
              <Field label={to('instagram')}>
                <input
                  className='input'
                  dir='ltr'
                  placeholder={to('socialPlaceholder')}
                  value={form.instagram}
                  onChange={(e) => set({ instagram: e.target.value })}
                />
              </Field>
              <Field label={to('tiktok')}>
                <input
                  className='input'
                  dir='ltr'
                  placeholder={to('socialPlaceholder')}
                  value={form.tiktok}
                  onChange={(e) => set({ tiktok: e.target.value })}
                />
              </Field>
            </div>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <span>{to('links')}</span>
                <span className={styles.counter}>
                  {form.links.length} / {MAX_LINKS}
                </span>
              </div>
              <LinksEditor links={form.links} onChange={(links) => set({ links })} />
            </div>
          </Section>

          <Section id='sports' title={t('section.sports')}>
            <SportPicker selected={form.sports} onChange={(sports) => set({ sports })} />
          </Section>

          <Section id='media' title={t('section.media')}>
            <MediaList coachId={profile.id} items={media} sports={profile.sports} onChange={setMedia} />
          </Section>

          <Section id='certifications' title={t('section.certifications')}>
            <CertificationList coachId={profile.id} items={certs} onChange={setCerts} />
          </Section>

          <Section id='private' title={t('section.private')}>
            <PrivateSessionSettings
              value={form.private}
              onChange={(p) => set({ private: p })}
              active={profile.privatePrice !== null && profile.privateDuration !== null ? { price: profile.privatePrice, duration: profile.privateDuration } : null}
            />
          </Section>

          <Section id='locations' title={t('section.locations')}>
            <VenuesLink />
          </Section>

          <Section id='account' title={t('section.account')}>
            <Field label={tc('email')}>
              {/* The login email can't be changed here. */}
              <input className='input' dir='ltr' value={email} disabled />
            </Field>
            <PasswordSetting />
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>{t('theme')}</span>
              <ThemeChoiceControl />
            </div>
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>{t('language')}</span>
              <LocaleChoiceControl />
            </div>
          </Section>
        </div>
      </div>

      {(dirty || error) && (
        <section className={styles.saveBar} aria-label={t('unsaved')}>
          <span className={styles.saveText}>{error || t('unsaved')}</span>
          <div className={styles.saveActions}>
            <button
              type='button'
              className={styles.discard}
              disabled={busy}
              onClick={() => {
                setForm(formOf(profile));
                setError('');
              }}
            >
              {t('discard')}
            </button>
            <button type='button' className='btn' disabled={busy} onClick={save}>
              {busy ? to('saving') : t('saveChanges')}
            </button>
          </div>
        </section>
      )}
      {toast && <output className={styles.toast}>{tc('saved')}</output>}
    </div>
  );
}
