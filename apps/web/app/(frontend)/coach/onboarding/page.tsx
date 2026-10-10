'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { CertificationList } from '@/components/CertificationList';
import { LinksEditor, toLinks, type LinkDraft } from '@/components/LinksEditor';
import { PhotoUpload } from '@/components/PhotoUpload';
import { SportPicker } from '@/components/SportPicker';
import { getOnboarding, saveProfile, submitProfile, type Certification, type Onboarding } from '@/lib/client/coach-api';
import type { SportDTO } from '@/lib/server/dto';
import {
  BIO_MAX,
  firstIncompleteStep,
  MAX_CERTS,
  MAX_LINKS,
  MAX_SPORTS,
  missingFields,
  sportName,
  STEP_OF,
  type MissingField,
} from '@/lib/shared/coach-rules';
import styles from './page.module.css';

type Step = 1 | 2 | 3 | 4 | 5;
const STEP_KEYS = ['you', 'socials', 'sports', 'certifications', 'review'] as const;
const SAVE_ERRORS = ['invalid_profile', 'invalid_upload', 'profile_locked'] as const;

/** The form state; photoPath is only set when a new photo was uploaded and not yet saved. */
type Form = {
  photoPath?: string;
  photoUrl: string | null;
  bio: string;
  instagram: string;
  tiktok: string;
  links: LinkDraft[];
  sports: SportDTO[];
  certifications: Certification[];
};

const formOf = ({ coach }: Onboarding): Form => ({
  photoUrl: coach.photoUrl,
  bio: coach.bio ?? '',
  instagram: coach.instagram ?? '',
  tiktok: coach.tiktok ?? '',
  links: coach.links.map(({ id, label, url }) => ({ key: id, label, url })),
  sports: coach.sports,
  certifications: coach.certifications,
});

/** The fields a step saves, as the server returned them. */
function savedPart(step: Step, saved: Form): Partial<Form> {
  if (step === 1) return { photoPath: undefined, photoUrl: saved.photoUrl, bio: saved.bio };
  if (step === 2) return { instagram: saved.instagram, tiktok: saved.tiktok, links: saved.links };
  return { sports: saved.sports };
}

/** Onboarding has no app shell, so it carries its own way out. */
function LogOut() {
  const tc = useTranslations('common');
  return (
    <div className={styles.topBar}>
      <button type='button' className='btn-ghost sm' onClick={() => signOut({ callbackUrl: '/login' })}>
        {tc('logOut')}
      </button>
    </div>
  );
}

/** A labelled block; not a <label>, since the editors inside hold several controls. */
function Group({ label, hint, children }: Readonly<{ label: string; hint?: string; children: React.ReactNode }>) {
  return (
    <div className={`stack ${styles.group}`}>
      <div className='label'>{label}</div>
      {hint && <div className='muted'>{hint}</div>}
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const te = useTranslations('errors');
  const f = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const { update } = useSession();
  const [data, setData] = useState<Onboarding | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const apply = useCallback(
    (res: Awaited<ReturnType<typeof getOnboarding>>) => {
      if (!res.ok) return setError(te('generic'));
      setData(res.data);
      setForm(formOf(res.data));
      setStep(firstIncompleteStep(res.data.missing));
    },
    [te],
  );
  const load = useCallback(() => getOnboarding().then(apply), [apply]);

  useEffect(() => {
    getOnboarding().then(apply);
  }, [apply]);

  // An admin's decision reaches the session on the next read; check whenever the coach comes back to the tab.
  const status = data?.coach.status;
  useEffect(() => {
    const onFocus = async () => {
      const s = await update();
      if (s?.user.coachStatus === 'ACTIVE') router.replace('/coach/dashboard');
      else if (s?.user.coachStatus && s.user.coachStatus !== status) load();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [update, router, load, status]);

  // An approved coach can arrive here on a stale session (e.g. from the approval email in a new tab):
  // refresh the session so the route guard knows, then go to the dashboard.
  useEffect(() => {
    if (status === 'ACTIVE') update().then(() => router.replace('/coach/dashboard'));
  }, [status, update, router]);

  if (!data || !form || data.coach.status === 'ACTIVE') {
    return <div className={`stack ${styles.wrap}`}>{error ? <div className={styles.error}>{error}</div> : t('loading')}</div>;
  }

  const id = data.coach.id;
  // Functional updates: an upload or sport add can finish after the coach typed more, so never write back a stale form.
  const set = (patch: Partial<Form>) => setForm((prev) => prev && { ...prev, ...patch });
  // Worked out from what's on screen so the review step is never behind; the server checks again on submit.
  const missing = missingFields({
    photoPath: form.photoUrl,
    bio: form.bio,
    instagram: form.instagram,
    tiktok: form.tiktok,
    sportCount: form.sports.length,
  });
  const missingText = (m: MissingField) => t(`missing.${m}`);

  /** What each step saves. Certifications save as each file is added. */
  const bodyFor = (s: Step) => {
    if (s === 1) return { bio: form.bio, ...(form.photoPath && { photoPath: form.photoPath }) };
    if (s === 2) {
      return { instagram: form.instagram, tiktok: form.tiktok, links: toLinks(form.links) };
    }
    if (s === 3) return { sportIds: form.sports.map((x) => x.id) };
    return null;
  };

  async function go(next: Step) {
    const body = bodyFor(step);
    if (body) {
      setBusy(true);
      setError('');
      const res = await saveProfile(id, body);
      setBusy(false);
      if (!res.ok) {
        const code = SAVE_ERRORS.find((c) => c === res.code) ?? 'generic';
        return setError(te(code));
      }
      const fresh = { ...data!, coach: res.data };
      setData(fresh);
      // Take back only what this step saved (e.g. normalized social links), so unsaved edits on other steps survive.
      setForm((prev) => prev && { ...prev, ...savedPart(step, formOf(fresh)) });
    }
    setStep(next);
  }

  /** Saves everything on screen first (Back and Edit don't save), then submits exactly what the coach reviewed. */
  async function submit() {
    // The button stays clickable so the coach always gets an answer; the list above says what to fix.
    if (missing.length) return setError(te('profile_incomplete'));
    setBusy(true);
    setError('');
    const saved = await saveProfile(id, { ...bodyFor(1), ...bodyFor(2), ...bodyFor(3) });
    if (!saved.ok) {
      setBusy(false);
      return setError(te(SAVE_ERRORS.find((c) => c === saved.code) ?? 'generic'));
    }
    const res = await submitProfile(id);
    setBusy(false);
    if (!res.ok) {
      return setError(te(res.code === 'profile_incomplete' ? 'profile_incomplete' : 'generic'));
    }
    await update();
    await load();
  }

  if (data.coach.status === 'PENDING' || data.coach.status === 'SUSPENDED') {
    const pending = data.coach.status === 'PENDING';
    return (
      <div className={`stack ${styles.wrap}`}>
        <LogOut />
        <div className='title'>{pending ? t('pendingTitle') : t('suspendedTitle')}</div>
        <div className={`stack ${styles.banner} ${pending ? '' : styles.bannerWarn}`}>
          <div>
            {pending && data.coach.submittedAt
              ? t('pendingBody', { date: f.dateTime(new Date(data.coach.submittedAt), { dateStyle: 'medium' }) })
              : t('suspendedBody')}
          </div>
          {!pending && data.reason && (
            <div dir='auto' className={`muted ${styles.reason}`}>
              {data.reason}
            </div>
          )}
        </div>
        {pending && <Summary form={form} coachId={id} locale={locale} />}
        <Link href='/' className={`btn-ghost ${styles.home}`}>
          {t('home')}
        </Link>
      </div>
    );
  }

  const stepWidth = styles['w' + step];
  const last = step === 5;
  const primary = () => (last ? submit() : go((step + 1) as Step));
  let action = t('submit');
  if (busy) action = last ? t('submitting') : t('saving');
  else if (!last) action = t('next');

  return (
    <div className={`stack ${styles.wrap}`}>
      <LogOut />
      <div className={styles.top}>
        <div className='title'>{t('title')}</div>
        <span className='muted'>{t('progress', { step: Math.min(step, 4) })}</span>
      </div>
      <div className='muted'>{t('intro')}</div>
      <div className={styles.bar}>
        <div className={`${styles.barFill} ${stepWidth}`} />
      </div>
      <div className={styles.steps}>
        {STEP_KEYS.map((k, i) => (
          <span key={k} className={step === i + 1 ? styles.stepOn : 'muted'}>
            {t(`steps.${k}`)}
          </span>
        ))}
      </div>

      {data.coach.status === 'REJECTED' && data.reason && (
        <div className={`stack ${styles.banner} ${styles.bannerWarn}`}>
          <div className='h3'>{t('rejectedTitle')}</div>
          <div>{t('rejectedBody')}</div>
          <div dir='auto' className={styles.reason}>
            {data.reason}
          </div>
        </div>
      )}

      <div className={`card stack ${styles.card}`}>
        {step === 1 && (
          <>
            <Group label={t('photo')}>
              <PhotoUpload userId={id} url={form.photoUrl} onUploaded={(photoPath, photoUrl) => set({ photoPath, photoUrl })} />
            </Group>
            <Group label={t('bio')} hint={t('bioHint')}>
              <textarea
                className='input'
                rows={6}
                dir='auto'
                maxLength={BIO_MAX}
                aria-label={t('bio')}
                value={form.bio}
                onChange={(e) => set({ bio: e.target.value })}
              />
              <div className={`muted ${styles.count}`}>{t('bioCount', { count: form.bio.trim().length, max: BIO_MAX })}</div>
            </Group>
          </>
        )}
        {step === 2 && (
          <>
            <Group label={t('instagram')}>
              <input
                className='input'
                dir='ltr'
                aria-label={t('instagram')}
                placeholder={t('socialHint')}
                value={form.instagram}
                onChange={(e) => set({ instagram: e.target.value })}
              />
            </Group>
            <Group label={t('tiktok')}>
              <input
                className='input'
                dir='ltr'
                aria-label={t('tiktok')}
                placeholder={t('socialHint')}
                value={form.tiktok}
                onChange={(e) => set({ tiktok: e.target.value })}
              />
            </Group>
            <Group label={t('links')} hint={t('linksHint', { max: MAX_LINKS })}>
              <LinksEditor links={form.links} onChange={(links) => set({ links })} />
            </Group>
          </>
        )}
        {step === 3 && (
          <Group label={t('sports')} hint={t('sportsHint', { max: MAX_SPORTS })}>
            <SportPicker selected={form.sports} onChange={(sports) => set({ sports })} />
          </Group>
        )}
        {step === 4 && (
          <Group label={t('certifications')} hint={t('certificationsHint', { max: MAX_CERTS })}>
            <CertificationList coachId={id} items={form.certifications} onChange={(certifications) => set({ certifications })} />
          </Group>
        )}
        {step === 5 && (
          <>
            <div className='h3'>{t('reviewTitle')}</div>
            {missing.length > 0 && (
              <ul className={styles.missing}>
                {missing.map((m) => (
                  <li key={m}>
                    <button type='button' className={styles.linkBtn} onClick={() => setStep(STEP_OF[m])}>
                      {missingText(m)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Summary form={form} coachId={id} locale={locale} onEdit={setStep} />
          </>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.nav}>
        <button type='button' className='btn-ghost' disabled={step === 1 || busy} onClick={() => setStep((step - 1) as Step)}>
          {t('back')}
        </button>
        <button type='button' className='btn' disabled={busy} onClick={primary}>
          {action}
        </button>
      </div>
    </div>
  );
}

/** Read-only overview, used on the review step and while pending. */
function Summary({ form, coachId, locale, onEdit }: Readonly<{ form: Form; coachId: string; locale: string; onEdit?: (s: Step) => void }>) {
  const t = useTranslations('onboarding');
  const row = (label: string, value: React.ReactNode, s: Step) => (
    <div className={styles.summaryRow}>
      <div className={`stack ${styles.summaryValue}`}>
        <div className='muted'>{label}</div>
        <div>{value}</div>
      </div>
      {onEdit && (
        <button type='button' className='btn-ghost sm' onClick={() => onEdit(s)}>
          {t('edit')}
        </button>
      )}
    </div>
  );
  return (
    <div>
      {row(t('photo'), form.photoUrl ? t('added') : t('none'), 1)}
      {row(
        t('bio'),
        <span dir='auto' className={styles.reason}>
          {form.bio || t('none')}
        </span>,
        1,
      )}
      {row(t('instagram'), <bdi>{form.instagram || t('none')}</bdi>, 2)}
      {row(t('tiktok'), <bdi>{form.tiktok || t('none')}</bdi>, 2)}
      {row(
        t('links'),
        form.links.length
          ? form.links.map((l) => (
              <div key={l.key}>
                <bdi>{l.label}</bdi> · <bdi>{l.url}</bdi>
              </div>
            ))
          : t('none'),
        2,
      )}
      {row(t('sports'), form.sports.length ? form.sports.map((s) => sportName(s, locale)).join(' · ') : t('none'), 3)}
      {row(
        t('certifications'),
        form.certifications.length ? <CertificationList coachId={coachId} items={form.certifications} readOnly /> : t('none'),
        4,
      )}
    </div>
  );
}
