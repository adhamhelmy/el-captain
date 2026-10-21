import { setupComplete, setupHiddenKey, setupSteps, type SetupKey } from '@el-captain/rules/coach-setup';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { load, peek } from '@/api/cache';
import { api, ApiError } from '@/api/client';
import { PATHS } from '@/api/paths';
import type { CoachStats, Onboarding, PrivateRequest, Session, Sport, Venue } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { cachedVenues, myVenues } from '@/coach/data';
import { fillLabel } from '@/coach/session-form';
import { SessionForm } from '@/coach/SessionForm';
import { getItem, setItem } from '@/lib/storage';
import { openPage } from '@/nav/open';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { LinkText } from '@/ui/LinkText';
import { Screen } from '@/ui/Screen';
import { SectionHead } from '@/ui/SectionHead';
import { Sheet } from '@/ui/Sheet';
import { FadeIn, Loading, RowSkeleton, StatsSkeleton } from '@/ui/Skeleton';
import { Stats } from '@/ui/Stats';
import { Text } from '@/ui/Text';

const isolate = (s: string) => `⁨${s}⁩`;
/** The keychain allows letters, digits and . - _ in keys. */
const hiddenKey = (coachId: string) => setupHiddenKey(coachId).replace(/[^\w.-]/g, '_');
/** Where each unfinished setup step takes the coach in the app. */
const SETUP_ROUTE: Record<SetupKey, Href | null> = {
  approved: null,
  location: '/coach/venues',
  session: '/coach/sessions?add=1' as Href,
  pricing: '/coach/profile',
};
const ACTION_ERRORS = ['request_closed', 'time_conflict', 'network'] as const;
const scheduled = (s: Session) => s.status === 'SCHEDULED';
const pendingOnly = (r: PrivateRequest) => r.status === 'PENDING';

/** The web's coach dashboard: setup card, numbers, the next sessions and requests waiting for an answer. */
export default function CoachDashboard() {
  const t = useTranslations('coachDashboard');
  const ts = useTranslations('schedule');
  const tr = useTranslations('requests');
  const te = useTranslations('errors');
  const tcl = useTranslations('clients');
  const l = useSessionLabels();
  const tc = useTranslations('common');
  const f = useFormatter();
  // Big sums as 36.6k so the narrow stat tiles stay one short line.
  const compact = (n: number) => (n >= 10_000 ? tc('thousands', { n: f.number(Math.round(n / 100) / 10) }) : f.number(n));
  const { colors } = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState(() => peek<CoachStats>(PATHS.coachStats) ?? null);
  const [statsFailed, setStatsFailed] = useState(false);
  const [upcoming, setUpcoming] = useState(() => peek<Session[]>(PATHS.myUpcoming)?.filter(scheduled) ?? null);
  const [pastCount, setPastCount] = useState(() => peek<Session[]>(PATHS.myPast)?.length ?? 0);
  const [requests, setRequests] = useState(() => peek<PrivateRequest[]>(PATHS.myRequests)?.filter(pendingOnly) ?? null);
  const [onboarding, setOnboarding] = useState(() => peek<Onboarding>(PATHS.onboarding) ?? null);
  const [venues, setVenues] = useState<Venue[] | null>(() => cachedVenues({ active: true }));
  const [hidden, setHidden] = useState(true);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  // Reloads whenever the tab comes back into view, so a change made on another tab shows here.
  useFocusEffect(
    useCallback(() => {
      let stale = false;
      load<Onboarding>(PATHS.onboarding)
        .then(async (r) => {
          if (stale) return;
          setOnboarding(r);
          setHidden((await getItem(hiddenKey(r.coach.id))) === '1');
        })
        .catch(() => {});
      myVenues({ active: true }).then((v) => !stale && setVenues(v));
      load<PrivateRequest[]>(PATHS.myRequests)
        .then((r) => !stale && setRequests(r.filter(pendingOnly)))
        .catch(() => !stale && setRequests((r) => r ?? []));
      load<CoachStats>(PATHS.coachStats)
        .then((r) => !stale && setStats(r))
        .catch(() => !stale && setStatsFailed(true));
      load<Session[]>(PATHS.myUpcoming)
        .then((r) => !stale && setUpcoming(r.filter(scheduled)))
        .catch(() => !stale && setUpcoming([]));
      load<Session[]>(PATHS.myPast)
        .then((r) => !stale && setPastCount(r.length))
        .catch(() => {});
      return () => {
        stale = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- reload re-runs it after publishing or accepting
    }, [reload]),
  );

  async function answer(r: PrivateRequest, accept: boolean) {
    if (busy) return;
    setBusy(r.id);
    setError(null);
    try {
      await api(`/api/private-requests/${r.id}/${accept ? 'accept' : 'reject'}`, { method: 'POST', json: {} });
      setRequests((list) => list?.filter((x) => x.id !== r.id) ?? null);
      if (accept) setReload((n) => n + 1);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setError(te(ACTION_ERRORS.find((c) => c === code) ?? 'generic'));
    } finally {
      setBusy('');
    }
  }

  const hide = () => {
    if (onboarding) setItem(hiddenKey(onboarding.coach.id), '1');
    setHidden(true);
  };

  const coach = onboarding?.coach;
  const steps =
    coach && venues && upcoming
      ? setupSteps({ venueCount: venues.length, sessionCount: upcoming.length + pastCount, privatePrice: coach.privatePrice, privateDuration: coach.privateDuration })
      : null;
  const doneCount = steps?.filter((s) => s.done).length ?? 0;
  const sports: Sport[] = coach?.sports.filter((s) => s.status === 'APPROVED') ?? [];

  return (
    <Screen>
      <Text variant="label">{t('welcome')}</Text>
      <Text variant="display">{t('title', { name: isolate((user?.name ?? '').split(' ')[0].toUpperCase()) })}</Text>
      <Button label={ts('add')} onPress={() => setAdding(true)} />
      {notice && (
        <Pressable onPress={() => setNotice(null)} accessibilityRole="alert" style={[styles.notice, { borderColor: colors.accentText, backgroundColor: colors.accentTint }]}>
          <Text>{notice}</Text>
        </Pressable>
      )}

      {/* Shown until the coach hides it or finishes every step. */}
      {steps && !hidden && !setupComplete(steps) && (
        <Card style={styles.setup}>
          <View style={styles.between}>
            <View style={styles.grow}>
              <Text style={styles.setupTitle}>{t('setup.title')}</Text>
              <Text variant="label">{t('setup.count', { done: doneCount, total: steps.length })}</Text>
            </View>
            <LinkText label={t('setup.hide')} onPress={hide} muted />
          </View>
          <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
            <View style={[styles.trackFill, { backgroundColor: colors.accent, width: `${(doneCount / steps.length) * 100}%` }]} />
          </View>
          {steps.map((s) => {
            const to = SETUP_ROUTE[s.key];
            return (
              <Pressable
                key={s.key}
                disabled={s.done || !to}
                onPress={() => to && router.push(to)}
                style={[styles.tile, { borderColor: colors.border, opacity: s.done ? 0.6 : 1 }]}>
                <View style={[styles.dot, { borderColor: s.done ? colors.accent : colors.border, backgroundColor: s.done ? colors.accent : 'transparent' }]}>
                  {s.done && <Text style={[styles.check, { color: colors.onAccent }]}>✓</Text>}
                </View>
                <Text>{t(`setup.${s.key}`)}</Text>
              </Pressable>
            );
          })}
        </Card>
      )}

      {!stats && !statsFailed && <StatsSkeleton />}
      {stats && (
        <FadeIn>
          <Stats
            oneLineLabels
            items={[
              [f.number(stats.bookingsNext7), t('statsShort.bookings')],
              [compact(stats.earnings30), t('statsShort.revenue'), tcl('egp')],
              [stats.fillRate === null ? '—' : f.number(stats.fillRate / 100, { style: 'percent' }), t('statsShort.fill')],
            ]}
          />
        </FadeIn>
      )}

      <SectionHead title={t('comingUp')} link={t('schedule')} onPress={() => router.push('/coach/sessions')} />
      {upcoming === null && (
        <Loading style={styles.list}>
          <RowSkeleton lead="date" />
          <RowSkeleton lead="date" />
        </Loading>
      )}
      {upcoming?.length === 0 && <Text muted>{t('nothingUpcoming')}</Text>}
      {upcoming && upcoming.length > 0 && (
        <FadeIn style={styles.list}>
          {upcoming.slice(0, 4).map((s) => {
            const full = s.type !== 'PRIVATE' && s.booked >= s.capacity;
            return (
              <Pressable
                key={s.id}
                accessibilityRole="link"
                onPress={() => openPage(`/coach-session/${s.id}`)}
                style={[styles.session, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.date, { backgroundColor: colors.surface2 }]}>
                  <Text variant="label" style={styles.dow}>
                    {l.day(s.startsAt)}
                  </Text>
                  <Text variant="display" style={styles.dnum}>
                    {l.dayNum(s.startsAt)}
                  </Text>
                </View>
                <View style={styles.grow}>
                  <Text numberOfLines={1} style={styles.sessionTitle}>
                    {l.title(s)}
                  </Text>
                  <Text variant="label" numberOfLines={1}>
                    {l.time(s.startsAt)} · {s.venue.name}
                  </Text>
                </View>
                <Text variant="label" style={{ color: full ? colors.warn : colors.text }}>
                  {fillLabel(s, l, ts('full'))}
                </Text>
              </Pressable>
            );
          })}
        </FadeIn>
      )}

      <SectionHead title={t('requestsTitle')} link={t('allRequests')} onPress={() => router.push('/coach/sessions?tab=requests' as Href)} />
      {error && <Text style={{ color: colors.warn }}>{error}</Text>}
      {requests === null && (
        <Loading>
          <RowSkeleton />
        </Loading>
      )}
      {requests?.length === 0 && <Text muted>{t('noRequests')}</Text>}
      {requests && requests.length > 0 && (
        <FadeIn style={styles.list}>
          {requests.slice(0, 3).map((r) => (
            <Card key={r.id} style={styles.request}>
              <Text style={styles.sessionTitle}>{r.member.name}</Text>
              <Text variant="label">{tr('line', { sport: l.sport(r.sport), when: l.when(r.startsAt), place: r.venue.name })}</Text>
              <View style={styles.actions}>
                <View style={styles.grow}>
                  <Button label={tr('accept')} busy={busy === r.id} onPress={() => answer(r, true)} />
                </View>
                <View style={styles.grow}>
                  <Button variant="secondary" label={tr('reject')} busy={busy === r.id} onPress={() => answer(r, false)} />
                </View>
              </View>
            </Card>
          ))}
        </FadeIn>
      )}

      <Sheet visible={adding} title={ts('newSession')} onClose={() => setAdding(false)}>
        {/* Only once both are in, so the form never says "no sports" while the profile is still loading. */}
        {coach && venues && (
          <SessionForm
            sports={sports}
            venues={venues}
            onCancel={() => setAdding(false)}
            onVenueAdded={(v) => setVenues((all) => [...(all ?? []), v])}
            onSaved={(saved) => {
              setAdding(false);
              setNotice(ts('published', { count: saved.length }));
              setReload((n) => n + 1);
            }}
          />
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  notice: { borderWidth: 1, borderRadius: radius.card, padding: 14 },
  setup: { gap: 12 },
  setupTitle: { fontSize: 16 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, padding: 12 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  check: { fontSize: 12 },
  session: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radius.card, padding: 12 },
  date: { width: 48, alignItems: 'center', borderRadius: 8, paddingVertical: 6 },
  dow: { fontSize: 11 },
  dnum: { fontSize: 24, lineHeight: 26 },
  sessionTitle: { fontSize: 15 },
  request: { gap: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  list: { gap: 10 },
});
