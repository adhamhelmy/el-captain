import { birthDateInvalid, filledSteps, formOf, leaveStep, privateDraftOk, savedBodiesOf, savedPart, submitBlocked, type CoachForm } from '@el-captain/rules/coach-form';
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
} from '@el-captain/rules/coach-rules';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { api, ApiError } from '@/api/client';
import type { CoachMe, Onboarding, Sport, Venue } from '@/api/types';
import { CertificationList, type Certification } from '@/coach/CertificationList';
import { LinksEditor } from '@/coach/LinksEditor';
import { PersonalFields } from '@/coach/PersonalFields';
import { PhotoPicker } from '@/coach/PhotoPicker';
import { PrivateSettings } from '@/coach/PrivateSettings';
import { SportPicker } from '@/coach/SportPicker';
import { VenueForm, type VenueSaved } from '@/coach/VenueForm';
import { useLocale } from '@/i18n/IntlProvider';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { LinkText } from '@/ui/LinkText';
import { Sheet } from '@/ui/Sheet';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';
import { ProfilePreview } from './ProfilePreview';

type Form = CoachForm<Sport, Certification>;

const SAVE_ERRORS = ['invalid_profile', 'invalid_upload', 'profile_locked', 'network'] as const;
const CHECKLIST: MissingField[] = ['photo', 'bio', 'address', 'sports', 'locations'];
const TOTAL = WIZARD_STEPS.length;
const ltr = { writingDirection: 'ltr', textAlign: 'left' } as const;

/** The main button: Continue, or on the review step Submit / Submit again (while submitting, Submitting…). */
function primaryKey(last: boolean, rejected: boolean, busy: boolean) {
  if (!last) return 'continue';
  if (busy) return 'submitting';
  return rejected ? 'submitAgain' : 'submit';
}

/** The web's seven-step profile wizard, on a phone: a progress bar instead of the rail. Every way out of a step saves it first. */
export function Wizard({ data, onSubmitted }: { data: Onboarding; onSubmitted: () => Promise<void> }) {
  const t = useTranslations('onboarding');
  const te = useTranslations('errors');
  const tv = useTranslations('venues');
  const tce = useTranslations('coachEdit');
  const tp = useTranslations('profile');
  const tc = useTranslations('common');
  const l = useSessionLabels();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const id = data.coach.id;
  const rejected = data.coach.status === 'REJECTED';

  const [form, setForm] = useState<Form>(() => formOf(data));
  const [step, setStep] = useState<WizardStep>(() => firstIncompleteStep(data.missing as MissingField[]));
  // Null until loaded, so nothing reads "no locations yet" while they're still on the way.
  const [loadedVenues, setLoadedVenues] = useState<Venue[] | null>(null);
  const venues = loadedVenues ?? [];
  const [venueOpen, setVenueOpen] = useState<Venue | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  // Uploads and sport adds still running; leaving the step now would save the form without them.
  const [working, setWorking] = useState(0);
  const track = (on: boolean) => setWorking((n) => n + (on ? 1 : -1));
  const [error, setError] = useState<string | null>(null);
  const saved = useRef(savedBodiesOf(form));
  const scroll = useRef<ScrollView>(null);

  // A failed load stays null (the server's own check is trusted meanwhile) and says so, with a retry, rather than
  // looking like "no locations yet".
  const [venueError, setVenueError] = useState(false);
  const loadVenues = useCallback(() => {
    api<Venue[]>('/api/venues/me')
      .then((list) => setLoadedVenues(list.filter((v) => !v.archived)))
      .catch(() => setVenueError(true));
  }, []);
  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  // Functional updates: an upload or sport add can finish after the coach typed more, so never write back a stale form.
  const set = (patch: Partial<Form>) => setForm((prev) => ({ ...prev, ...patch }));
  // Worked out from what's on screen so the progress and review are never behind; the server checks again on submit.
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
    setError(null);
    try {
      const coach = await api<CoachMe>(`/api/coaches/${id}`, { method: 'PATCH', json: body });
      // Take back only what this step saved, so unsaved edits elsewhere survive.
      setForm((prev) => ({ ...prev, ...savedPart(s, formOf<Sport, Certification>({ coach })) }));
      return true;
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setError(te(SAVE_ERRORS.find((c) => c === code) ?? 'generic'));
      return false;
    } finally {
      setBusy(false);
    }
  }

  /** A step whose fields can't be saved keeps the coach on it; the rule under the field is already red to say why. */
  const stepBlocked = () => (step === 1 && birthDateInvalid(form.birthDate)) || (step === 6 && !privateDraftOk(form.private));

  /** Every way to another step (Continue, Back, Edit and "Add now") goes through here. */
  async function go(next: WizardStep) {
    if (busy || working || next === step || stepBlocked()) return;
    if (!(await leaveStep(step, form, saved.current, (body) => save(step, body)))) return;
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  async function submit() {
    if (busy || working || missing.length || stepBlocked()) return;
    if (!(await leaveStep(step, form, saved.current, (body) => save(step, body)))) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/coaches/${id}/submit`, { method: 'POST', json: {} });
      await onSubmitted();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setError(te(code === 'profile_incomplete' || code === 'network' ? code : 'generic'));
    } finally {
      setBusy(false);
    }
  }

  function venueSaved({ venue, action }: VenueSaved) {
    setLoadedVenues((prev) => {
      const list = prev ?? [];
      if (action === 'archived') return list.filter((v) => v.id !== venue.id);
      return action === 'added' ? [...list, venue] : list.map((v) => (v.id === venue.id ? venue : v));
    });
    setVenueOpen(null);
  }

  async function removeVenue(v: Venue) {
    setError(null);
    try {
      await api(`/api/venues/${v.id}`, { method: 'DELETE' });
      setLoadedVenues((prev) => (prev ?? []).filter((x) => x.id !== v.id));
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setError(te(code === 'last_venue' || code === 'network' ? code : 'generic'));
    }
  }

  const key = WIZARD_STEPS[step - 1];
  const last = step === REVIEW_STEP;
  // Steps count from 1, so WIZARD_STEPS[step] is the one after this.
  const nextName = last ? t('lastStep') : t('nextStep', { name: t(`steps.${WIZARD_STEPS[Math.min(step, TOTAL - 1)]}`) });
  const blocked = submitBlocked(step, missing);
  const notAdded = t('notAdded');

  const summary: [string, string, WizardStep][] = [
    [t('photo'), form.photoUrl ? t('added') : notAdded, 1],
    [t('bio'), form.bio.trim() || notAdded, 1],
    [t('address'), form.address.trim() || notAdded, 1],
    [
      t('socials'),
      [
        form.instagram.trim() && t('onInstagram', { handle: form.instagram.trim() }),
        form.tiktok.trim() && t('onTiktok', { handle: form.tiktok.trim() }),
        ...form.links.map((x) => x.label || x.url),
      ]
        .filter(Boolean)
        .join(' · ') || notAdded,
      2,
    ],
    [t('steps.sports'), form.sports.map((s) => sportName(s, locale)).join(' · ') || notAdded, 3],
    [t('steps.locations'), venues.map((v) => v.name).join(' · ') || notAdded, 4],
    [t('steps.certifications'), form.certifications.length ? t('files', { count: form.certifications.length }) : notAdded, 5],
    [
      t('steps.private'),
      form.private.on && privateDraftOk(form.private) ? `${l.price(Number(form.private.price))} · ${l.minutes(Number(form.private.duration))}` : tce('privateOff'),
      6,
    ],
  ];

  return (
    <>
      <ScrollView
        ref={scroll}
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets>
        <View style={styles.progressText}>
          <Text variant="label">{t('stepOf', { step, total: TOTAL })}</Text>
          <Text variant="label">{nextName}</Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
          <View style={[styles.track, { backgroundColor: colors.accent, width: `${(step / TOTAL) * 100}%` }]} />
        </View>
        <View style={styles.steps}>
          {WIZARD_STEPS.map((k, i) => {
            const n = (i + 1) as WizardStep;
            const on = n === step;
            const flag = rejected && n === 1;
            const tick = done.has(n) && !on && !flag;
            let border = colors.border;
            if (tick) border = colors.accent;
            else if (flag) border = colors.warn;
            else if (on) border = colors.text;
            return (
              <Text
                key={k}
                accessibilityRole="button"
                accessibilityLabel={t(`steps.${k}`)}
                accessibilityState={{ selected: on }}
                onPress={() => go(n)}
                style={[styles.stepDot, { borderColor: border, backgroundColor: tick ? colors.accent : 'transparent', color: tick ? colors.onAccent : colors.text }]}>
                {tick ? '✓' : n}
              </Text>
            );
          })}
        </View>

        {rejected && data.reason && (
          <Card style={[styles.gap, { borderColor: colors.warn }]}>
            <Text style={{ color: colors.warn }}>{t('changesRequested')}</Text>
            <Text>{t('rejectedBody')}</Text>
            <Text muted>{data.reason}</Text>
          </Card>
        )}

        <View style={styles.gap}>
          <Text variant="eyebrow">{t('stepOf', { step, total: TOTAL })}</Text>
          <Text variant="display">{t(`stepTitle.${key}`)}</Text>
          <Text muted>{t(`stepIntro.${key}`, { max: MAX_SPORTS })}</Text>
        </View>

        {step === 1 && (
          <View style={styles.fields}>
            <View style={styles.gap}>
              <Text variant="label">{t('photo')}</Text>
              <PhotoPicker userId={id} url={form.photoUrl} warn={rejected} onBusy={track} onUploaded={(photoPath, photoUrl) => set({ photoPath, photoUrl })} />
            </View>
            <TextField
              label={t('address')}
              value={form.address}
              maxLength={CITY_MAX}
              placeholder={t('addressPlaceholder')}
              onChangeText={(address) => set({ address })}
              hint={t('addressHint')}
            />
            <TextField
              label={t('bio')}
              value={form.bio}
              maxLength={BIO_MAX}
              multiline
              style={styles.bio}
              onChangeText={(bio) => set({ bio })}
              aside={<Text variant="label">{t('bioCount', { count: form.bio.trim().length, max: BIO_MAX })}</Text>}
              hint={t('bioHint')}
            />
            <PersonalFields
              value={form}
              hint={tp('personalHintCoach')}
              onChange={({ birthDate, gender, languages }) => set({ birthDate, gender, languages })}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.fields}>
            {(['instagram', 'tiktok'] as const).map((net) => (
              <TextField
                key={net}
                label={`${t(net)} (@)`}
                value={form[net]}
                placeholder={t('socialPlaceholder')}
                autoCapitalize="none"
                autoCorrect={false}
                style={ltr}
                onChangeText={(v) => set(net === 'instagram' ? { instagram: v } : { tiktok: v })}
              />
            ))}
            <View style={styles.labelRow}>
              <Text variant="label">{t('links')}</Text>
              <Text variant="label">
                {form.links.length} / {MAX_LINKS}
              </Text>
            </View>
            <LinksEditor links={form.links} onChange={(links) => set({ links })} />
          </View>
        )}

        {step === 3 && <SportPicker selected={form.sports} onBusy={track} onChange={(sports) => set({ sports })} />}

        {step === 4 && venueError && (
          <View style={styles.gap}>
            <Text style={{ color: colors.warn }}>{te('generic')}</Text>
            <LinkText
              label={tc('tryAgain')}
              onPress={() => {
                setVenueError(false);
                loadVenues();
              }}
            />
          </View>
        )}
        {step === 4 && loadedVenues && (
          <View style={styles.fields}>
            {venues.length === 0 ? (
              <Card style={styles.gap}>
                <Text style={{ color: colors.accentText }} onPress={() => setVenueOpen('new')}>
                  {t('addFirstLocation')}
                </Text>
                <Text variant="label">{t('addFirstLocationSub')}</Text>
              </Card>
            ) : (
              <>
                {venues.map((v) => (
                  <Card key={v.id} style={styles.venue}>
                    <View style={styles.grow}>
                      <Text>{v.name}</Text>
                      <Text variant="label">{tv('line', { address: v.address, city: v.city })}</Text>
                    </View>
                    <LinkText label={tv('edit')} onPress={() => setVenueOpen(v)} />
                    <LinkText label={t('remove')} onPress={() => removeVenue(v)} muted />
                  </Card>
                ))}
                <LinkText label={t('addAnotherLocation')} onPress={() => setVenueOpen('new')} />
              </>
            )}
          </View>
        )}

        {step === 5 && <CertificationList coachId={id} items={form.certifications} onChange={(certifications) => set({ certifications })} />}

        {step === 6 && (
          <PrivateSettings
            value={form.private}
            onChange={(p) => set({ private: p })}
            active={form.private.on && privateDraftOk(form.private) ? { price: Number(form.private.price), duration: Number(form.private.duration) } : null}
          />
        )}

        {last && (
          <View style={styles.fields}>
            <Card style={styles.gap}>
              {CHECKLIST.map((m) => {
                const ok = !missing.includes(m);
                return (
                  <View key={m} style={styles.checkRow}>
                    <View style={[styles.check, { backgroundColor: ok ? colors.accent : colors.warnTint }]}>
                      <Text style={[styles.checkMark, { color: ok ? colors.onAccent : colors.warn }]}>{ok ? '✓' : '!'}</Text>
                    </View>
                    <Text style={styles.grow}>{t(`checklist.${m}`)}</Text>
                    {!ok && <LinkText label={t('addNow')} onPress={() => go(STEP_OF[m])} />}
                  </View>
                );
              })}
            </Card>
            {summary.map(([label, value, s]) => (
              <View key={label} style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <View style={styles.grow}>
                  <Text variant="label">{label}</Text>
                  <Text muted={value === notAdded} numberOfLines={4}>
                    {value}
                  </Text>
                </View>
                <LinkText label={t('edit')} onPress={() => go(s)} />
              </View>
            ))}
            <Text variant="eyebrow">{t('previewTitle')}</Text>
            <ProfilePreview name={data.coach.coachName} form={form} />
          </View>
        )}

        {error && <Text style={{ color: colors.warn }}>{error}</Text>}

        {blocked && <Text variant="label">{t('finishFirst')}</Text>}
        <Button label={t(primaryKey(last, rejected, busy))} busy={busy || working > 0} onPress={() => (last ? submit() : go((step + 1) as WizardStep))} />
        {step > 1 && <Button variant="secondary" label={t('back')} busy={busy || working > 0} onPress={() => go((step - 1) as WizardStep)} />}
      </ScrollView>

      <Sheet visible={!!venueOpen} title={venueOpen === 'new' ? tv('newTitle') : tv('editTitle')} onClose={() => setVenueOpen(null)}>
        {venueOpen && <VenueForm venue={venueOpen === 'new' ? undefined : venueOpen} onSaved={venueSaved} onCancel={() => setVenueOpen(null)} />}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 18 },
  gap: { gap: 8 },
  grow: { flex: 1 },
  fields: { gap: 16 },
  progressText: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 4, borderRadius: 2 },
  steps: { flexDirection: 'row', justifyContent: 'space-between' },
  stepDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, textAlign: 'center', lineHeight: 28, overflow: 'hidden', fontSize: 13 },
  bio: { minHeight: 140, textAlignVertical: 'top', paddingTop: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  venue: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkMark: { fontSize: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottomWidth: 1 },
});
