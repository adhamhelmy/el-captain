import { sportName } from '@el-captain/rules/coach-rules';
import { TEXT_MAX } from '@el-captain/rules/session-rules';
import { wallClock } from '@el-captain/rules/app-time';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { api, ApiError } from '@/api/client';
import type { PublicCoach } from '@/api/types';
import { useLocale } from '@/i18n/IntlProvider';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { DateField } from '@/ui/DateField';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';
import { requestProblems, requestStart, type RequestField } from './request';

const ltr = { writingDirection: 'ltr', textAlign: 'left' } as const;

/**
 * The web's PrivateRequestForm: place, sport, a Cairo date and time, and an optional message.
 * Rules show beside each field; Send explains what's wrong instead of being disabled.
 */
export function RequestForm({ coach, onSent }: Readonly<{ coach: PublicCoach; onSent: () => void }>) {
  const t = useTranslations('coachProfile');
  const te = useTranslations('errors');
  const { locale } = useLocale();
  const { colors } = useTheme();
  const today = wallClock(new Date()).date;
  const l = useSessionLabels();
  const [draft, setDraft] = useState({
    venueId: coach.venues[0]?.id ?? '',
    sportId: coach.sports[0]?.id ?? '',
    date: '',
    time: '',
    message: '',
  });
  const [bad, setBad] = useState<RequestField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const edit = (patch: Partial<typeof draft>) => setDraft({ ...draft, ...patch });

  const startsAt = requestStart(draft);
  // A readable time in the past shows as soon as it's typed, before anyone presses Send.
  const startsBad = !!startsAt && startsAt <= new Date();
  const formatBad = bad.includes('startsAtFormat');
  const tooLong = draft.message.trim().length > TEXT_MAX;

  async function send() {
    const problems = requestProblems(draft);
    setBad(problems);
    if (problems.length) return setError(t('fix'));
    setBusy(true);
    setError(null);
    try {
      await api('/api/private-requests', {
        method: 'POST',
        json: { coachId: coach.id, venueId: draft.venueId, sportId: draft.sportId, startsAt: startsAt!.toISOString(), message: draft.message },
      });
      onSent();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setError(te(code === 'private_unavailable' || code === 'invalid_session' || code === 'network' ? code : 'generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text muted>{t('formHint')}</Text>
      <Text variant="label">{t('requestLine', { minutes: coach.privateDuration!, price: l.price(coach.privatePrice!) })}</Text>
      <View style={styles.group}>
        <Text variant="label" style={bad.includes('venueId') ? { color: colors.warn } : undefined}>
          {t('where')}
        </Text>
        <View style={styles.wrap}>
          {coach.venues.map((v) => (
            <Chip key={v.id} label={`${v.name} · ${v.city}`} on={draft.venueId === v.id} onPress={() => edit({ venueId: v.id })} />
          ))}
        </View>
      </View>
      <View style={styles.group}>
        <Text variant="label" style={bad.includes('sportId') ? { color: colors.warn } : undefined}>
          {t('sport')}
        </Text>
        <View style={styles.wrap}>
          {coach.sports.map((s) => (
            <Chip key={s.id} label={sportName(s, locale)} on={draft.sportId === s.id} onPress={() => edit({ sportId: s.id })} />
          ))}
        </View>
      </View>
      <DateField
        label={t('date')}
        value={draft.date}
        onChange={(date) => edit({ date })}
        today={today}
        min={today}
        invalid={startsBad || formatBad || bad.includes('startsAt')}
      />
      <View style={styles.row}>
        <View style={styles.grow}>
          <TextField
            label={t('time')}
            value={draft.time}
            onChangeText={(time) => edit({ time })}
            placeholder="18:00"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            style={ltr}
            invalid={startsBad || formatBad || bad.includes('startsAt')}
          />
        </View>
      </View>
      {formatBad && !startsAt && <Text style={{ color: colors.warn }}>{t('dateFormat')}</Text>}
      {(startsBad || bad.includes('startsAt')) && <Text style={{ color: colors.warn }}>{t('pickFuture')}</Text>}
      <TextField
        label={t('message')}
        value={draft.message}
        onChangeText={(message) => edit({ message })}
        multiline
        style={styles.message}
        hint={t('messageCount', { count: draft.message.trim().length, max: TEXT_MAX })}
        error={tooLong ? t('messageCount', { count: draft.message.trim().length, max: TEXT_MAX }) : null}
      />
      {error && <Text style={{ color: colors.warn }}>{error}</Text>}
      <Button label={t('send')} onPress={send} busy={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  group: { gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 10 },
  grow: { flex: 1 },
  message: { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
});
