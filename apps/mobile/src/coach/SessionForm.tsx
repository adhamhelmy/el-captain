import { wallClock } from '@el-captain/rules/app-time';
import type { Period } from '@el-captain/rules/clock12';
import { sportName } from '@el-captain/rules/coach-rules';
import { REPEAT_OPTIONS, summaryValues } from '@el-captain/rules/repeat-summary';
import { CAPACITY, DURATION, PRICE_MAX, SESSION_LEVELS, sessionProblems, TEXT_MAX, TITLE_MAX, type SessionField } from '@el-captain/rules/session-rules';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { typedDate } from '@/account/typed-date';
import { api, ApiError } from '@/api/client';
import type { Session, Sport, Venue } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { useLocale } from '@/i18n/IntlProvider';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { DateField } from '@/ui/DateField';
import { LinkText } from '@/ui/LinkText';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';
import { blankDraft, clockText, draftOf, startInstant, timeWithPeriod, toSessionDraft, withOwn, type FormDraft } from './session-form';
import { goToPhotos, SessionCoverField, type CoverChoice } from './SessionCoverField';
import { VenueForm } from './VenueForm';

const SAVE_ERRORS = ['invalid_session', 'session_closed', 'time_conflict', 'network'] as const;
const ltr = { writingDirection: 'ltr', textAlign: 'left' } as const;

type Props = {
  session?: Session;
  sports: Sport[];
  venues: Venue[];
  onSaved: (saved: Session[]) => void;
  onCancel: () => void;
  /** A location added from inside the form, so the screen's own list stays current. */
  onVenueAdded?: (v: Venue) => void;
};

/**
 * The web's SessionDrawer: publish a group session (once or weekly for a few weeks) or edit one.
 * Each rule shows under its field and turns red when broken; the summary says what will be published.
 */
export function SessionForm({ session, sports: activeSports, venues: initialVenues, onSaved, onCancel, onVenueAdded }: Props) {
  const t = useTranslations('schedule');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const tv = useTranslations('venues');
  const { locale } = useLocale();
  const { colors } = useTheme();
  const today = wallClock(new Date()).date;
  const f = useFormatter();
  const l = useSessionLabels();
  const [activeVenues, setActiveVenues] = useState(initialVenues);
  const venues = withOwn(activeVenues, session?.venue);
  const sports = withOwn(activeSports, session?.sport);
  const [d, setD] = useState<FormDraft>(() => (session ? draftOf(session) : blankDraft(activeSports, initialVenues)));
  // The start time as typed (12-hour) and its AM/PM; d.time holds the 24-hour result the rules read.
  const [clock, setClock] = useState(() => (session ? clockText(d.time) : { text: '', period: 'PM' as Period }));
  const [addingVenue, setAddingVenue] = useState(false);
  // Null until the coach touches the cover, so an edit leaves it alone.
  const [cover, setCover] = useState<CoverChoice | null>(null);
  const [uploading, setUploading] = useState(false);
  const coachId = useAuth().user?.id ?? '';
  const [tried, setTried] = useState(false);
  const [serverBad, setServerBad] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = !!session && session.booked > 0;

  const draft = toSessionDraft(d);
  const problems = sessionProblems(draft);

  const edit = (patch: Partial<FormDraft>) => {
    setD((prev) => ({ ...prev, ...patch }));
    setServerBad([]);
  };
  const setTime = (text: string, period: Period) => {
    setClock({ text, period });
    edit({ time: timeWithPeriod(text, period) ?? text });
  };
  /** A rule turns red once its field has a value, or after a save attempt. */
  const bad = (field: SessionField, value: string) => serverBad.includes(field) || (problems.includes(field) && (tried || value.trim() !== ''));
  const rule = (field: SessionField, value: string, text: string) => ({ hint: text, error: bad(field, value) ? text : null });

  async function save() {
    // A cover still uploading would be left out of the session.
    if (uploading) return;
    setTried(true);
    if (problems.length) return setError(t('fix'));
    setBusy(true);
    setError(null);
    const body = {
      title: draft.title,
      description: draft.description,
      sportId: draft.sportId,
      venueId: draft.venueId,
      level: draft.level,
      startsAt: startInstant(session, d, draft.startsAt!),
      durationMin: draft.durationMin,
      price: draft.price,
      capacity: draft.capacity,
      ...cover?.body,
    };
    try {
      const saved = session
        ? await api<Session>(`/api/sessions/${session.id}`, { method: 'PATCH', json: body })
        : await api<Session[]>('/api/sessions', { method: 'POST', json: { ...body, repeatWeeks: draft.repeatWeeks } });
      onSaved(Array.isArray(saved) ? saved : [saved]);
    } catch (e) {
      const ae = e instanceof ApiError ? e : null;
      setServerBad(ae?.fields ?? []);
      setError(te(SAVE_ERRORS.find((c) => c === ae?.code) ?? 'generic'));
    } finally {
      setBusy(false);
    }
  }

  if (addingVenue) {
    return (
      <VenueForm
        onCancel={() => setAddingVenue(false)}
        onSaved={({ venue }) => {
          setActiveVenues((list) => [...list, venue]);
          edit({ venueId: venue.id });
          onVenueAdded?.(venue);
          setAddingVenue(false);
        }}
      />
    );
  }
  if (!sports.length) return <Text muted>{t('noSports')}</Text>;
  if (!venues.length) {
    return (
      <View style={styles.form}>
        <Text muted>{t('noVenues')}</Text>
        <LinkText label={tv('newLink')} onPress={() => setAddingVenue(true)} />
      </View>
    );
  }

  const repeat = Number(d.repeat);
  const summary = t('summary', {
    ...summaryValues(typedDate(d.date) ?? '', d.time, repeat, {
      weekdayLong: (at) => f.dateTime(at, { weekday: 'long' }),
      day: l.day,
      dayMonth: l.dayMonth,
      time: l.time,
    }),
  });
  const whenBad = bad('startsAt', d.date + clock.text);

  return (
    <View style={styles.form}>
      {locked && <Text variant="label">{t('lockedHint')}</Text>}

      <Text variant="eyebrow">{t('groupWhat')}</Text>
      <SessionCoverField
        coachId={coachId}
        url={cover ? cover.url : (session?.coverUrl ?? null)}
        onChange={setCover}
        onBusy={setUploading}
        onGoToPhotos={() => {
          onCancel();
          goToPhotos();
        }}
      />
      <TextField
        label={t('fieldTitle')}
        value={d.title}
        onChangeText={(title) => edit({ title })}
        placeholder={t('titlePlaceholder')}
        {...rule('title', d.title, t('rules.title', { max: TITLE_MAX }))}
      />
      <View style={styles.group}>
        <Text variant="label" style={bad('sportId', d.sportId) ? { color: colors.warn } : undefined}>
          {t('sport')}
        </Text>
        <View style={styles.wrap}>
          {sports.map((s) => (
            <Chip key={s.id} label={sportName(s, locale)} on={d.sportId === s.id} onPress={() => edit({ sportId: s.id })} />
          ))}
        </View>
      </View>
      <View style={styles.group}>
        <Text variant="label">{t('level')}</Text>
        <View style={styles.wrap}>
          {SESSION_LEVELS.map((level) => (
            <Chip key={level} label={l.level(level)} on={d.level === level} onPress={() => edit({ level })} />
          ))}
        </View>
      </View>

      <Text variant="eyebrow">{t('groupWhen')}</Text>
      <DateField
        label={t('date')}
        value={d.date}
        onChange={(date) => edit({ date })}
        today={today}
        min={today}
        editable={!locked}
        invalid={whenBad}
      />
      <View style={styles.timeRow}>
        <View style={styles.grow}>
          <TextField
            label={t('start')}
            value={clock.text}
            onChangeText={(text) => setTime(text, clock.period)}
            placeholder="6:30"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            editable={!locked}
            style={ltr}
            invalid={whenBad}
          />
        </View>
        <View style={styles.period}>
          <Segmented
            label={t('period')}
            options={[
              { value: 'AM', label: t('am') },
              { value: 'PM', label: t('pm') },
            ]}
            value={clock.period}
            onChange={(period: Period) => !locked && setTime(clock.text, period)}
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.minutes}>
          <TextField
            label={t('minutes')}
            value={d.duration}
            onChangeText={(duration) => edit({ duration })}
            keyboardType="number-pad"
            editable={!locked}
            style={ltr}
            invalid={bad('durationMin', d.duration)}
          />
        </View>
      </View>
      <Text variant="label" style={whenBad ? { color: colors.warn } : undefined}>
        {/* Once something is typed that can't be read as a date and time, say how to write it. */}
        {whenBad && !draft.startsAt ? t('dateTimeFormat') : t('rules.startsAt')}
      </Text>
      <Text variant="label" style={bad('durationMin', d.duration) ? { color: colors.warn } : undefined}>
        {t('rules.duration', { min: DURATION.min, max: DURATION.max })}
      </Text>
      {!session && (
        <View style={styles.group}>
          <Text variant="label">{t('repeatLabel')}</Text>
          <View style={styles.wrap}>
            {REPEAT_OPTIONS.map((weeks) => (
              <Chip key={weeks} label={t('repeatOption', { weeks })} on={repeat === weeks} onPress={() => edit({ repeat: String(weeks) })} />
            ))}
          </View>
        </View>
      )}

      <Text variant="eyebrow">{t('groupWhere')}</Text>
      <View style={styles.group}>
        <View style={styles.labelRow}>
          <Text variant="label">{t('location')}</Text>
          {!locked && <LinkText label={tv('newLink')} onPress={() => setAddingVenue(true)} />}
        </View>
        <View style={styles.wrap}>
          {venues.map((v) => (
            <Chip
              key={v.id}
              label={`${v.name} · ${v.city}${v.archived ? ` · ${tv('archived')}` : ''}`}
              on={d.venueId === v.id}
              onPress={() => !locked && edit({ venueId: v.id })}
            />
          ))}
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.grow}>
          <TextField
            label={t('price')}
            value={d.price}
            onChangeText={(price) => edit({ price })}
            keyboardType="number-pad"
            style={ltr}
            {...rule('price', d.price, t('rules.price', { max: PRICE_MAX }))}
          />
        </View>
        <View style={styles.grow}>
          <TextField
            label={t('spots')}
            value={d.capacity}
            onChangeText={(capacity) => edit({ capacity })}
            keyboardType="number-pad"
            style={ltr}
            {...rule('capacity', d.capacity, t('rules.capacity', { min: CAPACITY.min, max: CAPACITY.max }))}
          />
        </View>
      </View>
      <TextField
        label={t('descriptionOptional')}
        value={d.description}
        onChangeText={(description) => edit({ description })}
        placeholder={t('descriptionPlaceholder')}
        multiline
        style={styles.text}
        {...rule('description', d.description, t('rules.description', { max: TEXT_MAX }))}
      />

      {!session && <Text>{summary}</Text>}
      {error && <Text style={{ color: colors.warn }}>{error}</Text>}
      <Button label={session ? tc('save') : t('publishCount', { count: Number.isFinite(repeat) ? repeat : 1 })} onPress={save} busy={busy || uploading} />
      <Button variant="secondary" label={tc('cancel')} onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  group: { gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 10 },
  timeRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  grow: { flex: 1 },
  minutes: { width: 110 },
  period: { width: 130 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  text: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
});
