'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CertificationList } from '@/components/CertificationList';
import { LinksEditor } from '@/components/LinksEditor';
import { PhotoUpload } from '@/components/PhotoUpload';
import { SportPicker } from '@/components/SportPicker';
import { VenueDrawer, type VenueSaved } from '@/components/VenueDrawer';
import { saveProfile, submitProfile, type Onboarding } from '@/lib/client/coach-api';
import { archiveVenue, listVenues } from '@/lib/client/session-api';
import type { VenueDTO } from '@/lib/server/dto';
import {
  BIO_MAX,
  CITY_MAX,
  doneSteps,
  firstIncompleteStep,
  MAX_LINKS,
  MAX_SPORTS,
  missingFields,
  REVIEW_STEP,
  sportName,
  STEP_OF,
  WIZARD_STEPS,
  type MissingField,
  type WizardStep,
} from '@/lib/shared/coach-rules';
import { ProfilePreview } from './ProfilePreview';
import { TopBar, type SaveState } from './TopBar';
import { filledSteps, formOf, leaveStep, savedBodiesOf, savedPart, submitBlocked, type Form } from './wizard-form';
import styles from './onboarding.module.css';

const SAVE_ERRORS = ['invalid_profile', 'invalid_upload', 'profile_locked'] as const;
const SUB: Record<(typeof WIZARD_STEPS)[number], 'required' | 'optional' | 'atLeastOne' | 'submit'> = {
  you: 'required',
  socials: 'optional',
  sports: 'required',
  locations: 'atLeastOne',
  certifications: 'optional',
  review: 'submit',
};
const CHECKLIST: MissingField[] = ['photo', 'bio', 'address', 'sports', 'locations'];
const TOTAL = WIZARD_STEPS.length;

/** The steps down the side: ✓ when done, the current one outlined, step 1 flagged when an admin asked for changes. */
function StepRail({
  step,
  done,
  rejected,
  onGo,
}: Readonly<{ step: WizardStep; done: Set<WizardStep>; rejected: boolean; onGo(step: WizardStep): void }>) {
  const t = useTranslations('onboarding');
  return (
    <aside className={styles.rail}>
      <div className={styles.railTitle}>{t('railTitle')}</div>
      {WIZARD_STEPS.map((k, i) => {
        const n = (i + 1) as WizardStep;
        const on = n === step;
        const flag = rejected && n === 1;
        const tick = done.has(n) && !on && !flag;
        let circle = styles.circle;
        if (tick) circle += ` ${styles.circleDone}`;
        else if (flag) circle += ` ${styles.circleWarn}`;
        else if (on) circle += ` ${styles.circleOn}`;
        return (
          <button
            key={k}
            type='button'
            className={on ? `${styles.railStep} ${styles.railOn}` : styles.railStep}
            aria-current={on ? 'step' : undefined}
            onClick={() => onGo(n)}
          >
            <span className={circle}>{tick ? '✓' : n}</span>
            <span className={styles.railText}>
              <span className={styles.railLabel}>{t(`steps.${k}`)}</span>
              <span className={flag ? `${styles.railSub} ${styles.railSubWarn}` : styles.railSub}>
                {flag ? t('stepSub.needsChanges') : t(`stepSub.${SUB[k]}`)}
              </span>
            </span>
          </button>
        );
      })}
    </aside>
  );
}

/** The main button: Continue, or on the review step Submit / Submit again (while submitting, Submitting…). */
function primaryKey(last: boolean, rejected: boolean, busy: boolean) {
  if (!last) return 'continue';
  if (busy) return 'submitting';
  return rejected ? 'submitAgain' : 'submit';
}

type Props = Readonly<{ data: Onboarding; onSubmitted(): Promise<void> }>;

/** The six-step profile wizard. Every way out of a step saves it first; the rail shows what's done. */
export function Wizard({ data, onSubmitted }: Props) {
  const t = useTranslations('onboarding');
  const te = useTranslations('errors');
  const tv = useTranslations('venues');
  const locale = useLocale();
  const id = data.coach.id;
  const rejected = data.coach.status === 'REJECTED';

  const [form, setForm] = useState<Form>(() => formOf(data));
  const [step, setStep] = useState<WizardStep>(() => firstIncompleteStep(data.missing));
  // Null until loaded, so nothing reads "no locations yet" while they're still on the way.
  const [loadedVenues, setLoadedVenues] = useState<VenueDTO[] | null>(null);
  const venues = loadedVenues ?? [];
  const [venueOpen, setVenueOpen] = useState<VenueDTO | 'new' | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saved = useRef(savedBodiesOf(form));
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listVenues()
      .then((r) => {
        if (!r.ok) setError(te('generic'));
        setLoadedVenues(r.ok ? r.data.filter((v) => !v.archived) : []);
      })
      .catch(() => {
        setError(te('generic'));
        setLoadedVenues([]);
      });
  }, [te]);

  // Functional updates: an upload or sport add can finish after the coach typed more, so never write back a stale form.
  const set = (patch: Partial<Form>) => setForm((prev) => ({ ...prev, ...patch }));
  // Worked out from what's on screen so the rail and review are never behind; the server checks again on submit.
  const missing = missingFields({
    photoPath: form.photoUrl,
    city: form.address,
    bio: form.bio,
    instagram: form.instagram,
    tiktok: form.tiktok,
    sportCount: form.sports.length,
    // Until the list is in, trust what the server reported.
    venueCount: loadedVenues ? loadedVenues.length : Number(!data.missing.includes('locations')),
  });
  const done = doneSteps(missing, filledSteps(form));

  async function save(s: WizardStep, body: object) {
    setBusy(true);
    setSaveState('saving');
    setError('');
    const res = await saveProfile(id, body);
    setBusy(false);
    if (!res.ok) {
      setSaveState('error');
      setError(te(SAVE_ERRORS.find((c) => c === res.code) ?? 'generic'));
      return false;
    }
    setSaveState('saved');
    // Take back only what this step saved, so unsaved edits elsewhere survive.
    setForm((prev) => ({ ...prev, ...savedPart(s, formOf({ ...data, coach: res.data })) }));
    return true;
  }

  /** Every way to another step (Continue, Back, the rail, Edit and "Add now") goes through here. */
  async function go(next: WizardStep) {
    if (busy || next === step) return;
    if (!(await leaveStep(step, form, saved.current, (body) => save(step, body)))) return;
    setStep(next);
    top.current?.scrollIntoView({ block: 'start' });
  }

  async function submit() {
    if (busy || missing.length) return;
    if (!(await leaveStep(step, form, saved.current, (body) => save(step, body)))) return;
    setBusy(true);
    setError('');
    const res = await submitProfile(id);
    setBusy(false);
    if (!res.ok) return setError(te(res.code === 'profile_incomplete' ? 'profile_incomplete' : 'generic'));
    await onSubmitted();
  }

  function venueSaved({ venue, action }: VenueSaved) {
    setLoadedVenues((prev) => {
      const list = prev ?? [];
      if (action === 'archived') return list.filter((v) => v.id !== venue.id);
      return action === 'added' ? [...list, venue] : list.map((v) => (v.id === venue.id ? venue : v));
    });
    setVenueOpen(null);
  }

  async function removeVenue(v: VenueDTO) {
    setError('');
    const r = await archiveVenue(v.id);
    if (r.ok) setLoadedVenues((prev) => (prev ?? []).filter((x) => x.id !== v.id));
    else setError(te(r.code === 'last_venue' ? 'last_venue' : 'generic'));
  }

  const key = WIZARD_STEPS[step - 1];
  const last = step === REVIEW_STEP;
  // Steps count from 1, so WIZARD_STEPS[step] is the one after this.
  const nextName = last ? t('lastStep') : t('nextStep', { name: t(`steps.${WIZARD_STEPS[Math.min(step, TOTAL - 1)]}`) });
  const blocked = submitBlocked(step, missing);
  const progressWidth = styles['p' + step];
  const primary = t(primaryKey(last, rejected, busy));
  const none = <span className='dim'>{t('notAdded')}</span>;

  const summary: [string, React.ReactNode, WizardStep][] = [
    [t('photo'), form.photoUrl ? t('added') : none, 1],
    [t('bio'), form.bio.trim() ? <span className={styles.prewrap}>{form.bio}</span> : none, 1],
    [t('address'), form.address.trim() || none, 1],
    [
      t('socials'),
      [
        form.instagram.trim() && t('onInstagram', { handle: form.instagram.trim() }),
        form.tiktok.trim() && t('onTiktok', { handle: form.tiktok.trim() }),
        ...form.links.map((l) => l.label || l.url),
      ]
        .filter(Boolean)
        .join(' · ') || none,
      2,
    ],
    [t('steps.sports'), form.sports.map((s) => sportName(s, locale)).join(' · ') || none, 3],
    [t('steps.locations'), venues.map((v) => v.name).join(' · ') || none, 4],
    [t('steps.certifications'), form.certifications.length ? t('files', { count: form.certifications.length }) : none, 5],
  ];

  return (
    <div className={styles.screen}>
      <TopBar save={saveState} />
      <div ref={top} className={styles.layout}>
        <StepRail step={step} done={done} rejected={rejected} onGo={go} />

        <div className={styles.main}>
          <div className={styles.mobileProgress}>
            <div className={styles.mobileProgressText}>
              <span>{t('stepOf', { step, total: TOTAL })}</span>
              <span>{nextName}</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={`${styles.progressFill} ${progressWidth}`} />
            </div>
          </div>

          {rejected && data.reason && (
            <div className={styles.rejected}>
              <div className={styles.rejectedHead}>
                <span className={styles.rejectedDot} aria-hidden />
                {t('changesRequested')}
              </div>
              <div>{t('rejectedBody')}</div>
              <div dir='auto' className={styles.rejectedReason}>
                {data.reason}
              </div>
            </div>
          )}

          <div className={styles.head}>
            <div className={styles.overline}>{t('stepOf', { step, total: TOTAL })}</div>
            <h1 className={styles.stepTitle}>{t(`stepTitle.${key}`)}</h1>
            <div className={styles.intro}>{t(`stepIntro.${key}`, { max: MAX_SPORTS })}</div>
          </div>

          {step === 1 && (
            <div className={styles.fields}>
              <div className={styles.field}>
                <div className={styles.labelRow}>{t('photo')}</div>
                <PhotoUpload userId={id} url={form.photoUrl} warn={rejected} onUploaded={(photoPath, photoUrl) => set({ photoPath, photoUrl })} />
              </div>
              <label className={styles.field}>
                <span className={styles.labelRow}>{t('address')}</span>
                <input
                  className='input'
                  dir='auto'
                  maxLength={CITY_MAX}
                  placeholder={t('addressPlaceholder')}
                  value={form.address}
                  onChange={(e) => set({ address: e.target.value })}
                />
                <span className={styles.fieldHint}>{t('addressHint')}</span>
              </label>
              <label className={styles.field}>
                <span className={styles.labelRow}>
                  <span>{t('bio')}</span>
                  <span className={styles.counter}>{t('bioCount', { count: form.bio.trim().length, max: BIO_MAX })}</span>
                </span>
                <textarea
                  className={`input ${styles.bio}`}
                  rows={7}
                  dir='auto'
                  maxLength={BIO_MAX}
                  value={form.bio}
                  onChange={(e) => set({ bio: e.target.value })}
                />
                <span className={styles.fieldHint}>{t('bioHint')}</span>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className={styles.fields}>
              <div className={styles.socials}>
                {(['instagram', 'tiktok'] as const).map((net) => (
                  <label key={net} className={styles.field}>
                    <span className={styles.labelRow}>{t(net)}</span>
                    <span className={styles.atInput} dir='ltr'>
                      <span aria-hidden>@</span>
                      <input
                        dir='ltr'
                        placeholder={t('socialPlaceholder')}
                        value={form[net]}
                        onChange={(e) => set(net === 'instagram' ? { instagram: e.target.value } : { tiktok: e.target.value })}
                      />
                    </span>
                  </label>
                ))}
              </div>
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <span>{t('links')}</span>
                  <span className={styles.counter}>
                    {form.links.length} / {MAX_LINKS}
                  </span>
                </div>
                <LinksEditor links={form.links} onChange={(links) => set({ links })} />
              </div>
            </div>
          )}

          {step === 3 && <SportPicker selected={form.sports} onChange={(sports) => set({ sports })} />}

          {step === 4 && loadedVenues && (
            <div className={styles.locations}>
              {venues.length === 0 ? (
                <button type='button' className={styles.bigAdd} onClick={() => setVenueOpen('new')}>
                  <span className={styles.bigAddTitle}>{t('addFirstLocation')}</span>
                  <span className={styles.fieldHint}>{t('addFirstLocationSub')}</span>
                </button>
              ) : (
                <>
                  {venues.map((v) => (
                    <div key={v.id} className={styles.venueRow}>
                      <span className={styles.venueText}>
                        <bdi className={styles.venueName}>{v.name}</bdi>
                        <span dir='auto' className={styles.venueLine}>
                          {tv('line', { address: v.address, city: v.city })}
                        </span>
                      </span>
                      <button type='button' className={styles.textBtn} onClick={() => setVenueOpen(v)}>
                        {tv('edit')}
                      </button>
                      <button type='button' className={styles.textBtn} onClick={() => removeVenue(v)}>
                        {t('remove')}
                      </button>
                    </div>
                  ))}
                  <div>
                    <button type='button' className={styles.dashedBtn} onClick={() => setVenueOpen('new')}>
                      {t('addAnotherLocation')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 5 && <CertificationList coachId={id} items={form.certifications} onChange={(certifications) => set({ certifications })} />}

          {step === 6 && (
            <div className={styles.review}>
              <div className={styles.checklist}>
                {CHECKLIST.map((m) => {
                  const ok = !missing.includes(m);
                  return (
                    <div key={m} className={styles.checkRow}>
                      <span className={ok ? `${styles.checkMark} ${styles.checkOk}` : `${styles.checkMark} ${styles.checkMissing}`} aria-hidden>
                        {ok ? '✓' : '!'}
                      </span>
                      <span className={styles.checkLabel}>{t(`checklist.${m}`)}</span>
                      {!ok && (
                        <button type='button' className={styles.addNow} onClick={() => go(STEP_OF[m])}>
                          {t('addNow')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div>
                {summary.map(([label, value, s]) => (
                  <div key={label} className={styles.summaryRow}>
                    <div className={styles.summaryText}>
                      <span className={styles.summaryLabel}>{label}</span>
                      <span dir='auto' className={styles.summaryValue}>
                        {value}
                      </span>
                    </div>
                    <button type='button' className={styles.textBtn} onClick={() => go(s)}>
                      {t('edit')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.footer}>
            <button
              type='button'
              className={step === 1 ? `btn-ghost ${styles.hidden}` : 'btn-ghost'}
              disabled={busy}
              onClick={() => go((step - 1) as WizardStep)}
            >
              {t('back')}
            </button>
            <div className={styles.footerEnd}>
              {blocked && <span className={styles.fieldHint}>{t('finishFirst')}</span>}
              <button
                type='button'
                className={blocked ? `btn ${styles.blocked}` : 'btn'}
                disabled={busy || blocked}
                onClick={() => (last ? submit() : go((step + 1) as WizardStep))}
              >
                {primary}
              </button>
            </div>
          </div>
        </div>

        <aside className={styles.previewCol}>
          <div className={styles.railTitle}>{t('previewTitle')}</div>
          <ProfilePreview name={data.coach.coachName} form={form} />
        </aside>
      </div>

      {venueOpen && <VenueDrawer venue={venueOpen === 'new' ? undefined : venueOpen} onClose={() => setVenueOpen(null)} onSaved={venueSaved} />}
    </div>
  );
}
