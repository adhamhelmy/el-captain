'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { CertificationList } from '@/components/CertificationList';
import { LinksEditor, toLinks, type LinkDraft } from '@/components/LinksEditor';
import { LocaleChoiceControl } from '@/components/LocaleToggle';
import { PasswordSetting } from '@/components/PasswordSetting';
import { PhotoUpload } from '@/components/PhotoUpload';
import { SportPicker } from '@/components/SportPicker';
import { ThemeChoiceControl } from '@/components/ThemeToggle';
import { Field } from '@/components/ui';
import { getOnboarding, saveProfile, type Certification } from '@/lib/client/coach-api';
import { listVenues } from '@/lib/client/session-api';
import { BIO_MAX, CITY_MAX, MAX_LINKS, NAME_MAX, socialHandle } from '@/lib/shared/coach-rules';
import { privateSettingsOk } from '@/lib/shared/session-rules';
import type { CoachDTO, SportDTO } from '@/lib/server/dto';
import styles from './page.module.css';

const SAVE_ERRORS = ['invalid_profile', 'invalid_upload'] as const;
const SECTIONS = ['public', 'sports', 'certifications', 'private', 'locations', 'account'] as const;

/** Everything the save bar tracks; certificates save on their own as each file is added. */
type Form = {
  name: string;
  city: string;
  bio: string;
  instagram: string;
  tiktok: string;
  links: LinkDraft[];
  sports: SportDTO[];
  photo: { path: string; url: string } | null;
  privatePrice: string;
  privateDuration: string;
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
  privatePrice: c.privatePrice === null ? '' : String(c.privatePrice),
  privateDuration: c.privateDuration === null ? '' : String(c.privateDuration),
});

/** Compared to spot unsaved changes; row keys and sport details don't count. */
const snapshot = (f: Form) =>
  JSON.stringify({ ...f, links: f.links.map(({ label, url }) => [label, url]), sports: f.sports.map((s) => s.id), photo: f.photo?.path ?? null });

/** A blank field is "not set" (null), anything else is read as a number. */
const optionalNumber = (v: string) => (v.trim() === '' ? null : Number(v));

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
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState('');

  const show = (c: CoachDTO) => {
    setProfile(c);
    setForm(formOf(c));
    setCerts(c.certifications);
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
  const privateOk = privateSettingsOk(optionalNumber(form.privatePrice), optionalNumber(form.privateDuration));

  async function save() {
    if (!profile || !form) return;
    const price = optionalNumber(form.privatePrice);
    const duration = optionalNumber(form.privateDuration);
    if (!privateSettingsOk(price, duration)) return setError(t('privateRules'));
    setBusy(true);
    const res = await saveProfile(profile.id, {
      privatePrice: price,
      privateDuration: duration,
      name: form.name,
      city: form.city,
      bio: form.bio,
      instagram: form.instagram,
      tiktok: form.tiktok,
      links: toLinks(form.links),
      sportIds: form.sports.map((s) => s.id),
      ...(form.photo && { photoPath: form.photo.path }),
    });
    setBusy(false);
    if (!res.ok) return setError(te(SAVE_ERRORS.find((c) => c === res.code) ?? 'generic'));
    show(res.data);
    setToast(true);
  }

  const photoUrl = form.photo?.url ?? profile.photoUrl;

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
            <PhotoUpload userId={profile.id} url={photoUrl} onUploaded={(path, url) => set({ photo: { path, url } })} />
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

          <Section id='certifications' title={t('section.certifications')}>
            <CertificationList coachId={profile.id} items={certs} onChange={setCerts} />
          </Section>

          <Section id='private' title={t('section.private')}>
            <div className={styles.hint}>{t('privateHint')}</div>
            <div className='fields'>
              <Field label={t('privatePrice')}>
                <input
                  className='input'
                  inputMode='numeric'
                  dir='ltr'
                  placeholder='600'
                  value={form.privatePrice}
                  onChange={(e) => set({ privatePrice: e.target.value })}
                />
              </Field>
              <Field label={t('privateDuration')}>
                <input
                  className='input'
                  inputMode='numeric'
                  dir='ltr'
                  placeholder='60'
                  value={form.privateDuration}
                  onChange={(e) => set({ privateDuration: e.target.value })}
                />
              </Field>
            </div>
            <div className={privateOk ? styles.rule : styles.error}>{t('privateRules')}</div>
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
