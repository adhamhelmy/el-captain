import { CANCEL_CUTOFF_MS } from '@el-captain/rules/session-rules';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { load, peek, remember } from '@/api/cache';
import { api, ApiError } from '@/api/client';
import { DETAIL } from '@/api/paths';
import type { SessionDetail } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { openPage } from '@/nav/open';
import { bookingState } from '@/sessions/booking';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { Avatar } from '@/ui/Avatar';
import { BackLink } from '@/ui/BackLink';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { LinkText } from '@/ui/LinkText';
import { Screen } from '@/ui/Screen';
import { DetailSkeleton } from '@/ui/Skeleton';
import { Tag, typeTagKind } from '@/ui/Tag';
import { Text } from '@/ui/Text';

const BOOK_ERRORS = ['session_full', 'session_closed', 'cancel_too_late', 'network'] as const;
/** Wraps text whose direction may differ from the page (an email in Arabic), as the web's isolate. */
const isolate = (s: string) => `⁨${s}⁩`;

/** The web's SessionDetail. Guests see everything and are sent to log in to book, then brought back here. */
export default function SessionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTranslations('session');
  const te = useTranslations('errors');
  const td = useTranslations('data');
  const tst = useTranslations('status');
  const l = useSessionLabels();
  const { colors } = useTheme();
  const { user, returnTo, setReturnTo } = useAuth();
  const [s, setS] = useState<SessionDetail | null | undefined>(() => peek<SessionDetail>(DETAIL.session(id)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const path = `/session/${id}`;

  // Back on screen after logging in to book: the detour is done. Only while focused, so a copy that isn't
  // showing can't clear it before the redirect back here reads it.
  useFocusEffect(
    useCallback(() => {
      if (user && returnTo === path) setReturnTo(null);
    }, [user, returnTo, path, setReturnTo]),
  );

  useEffect(() => {
    let stale = false;
    load<SessionDetail>(DETAIL.session(id))
      .then((d) => !stale && setS(d))
      // Offline with this page already showing from the cache: keep it rather than swap in the error.
      .catch(() => !stale && setS((shown) => shown ?? null));
    return () => {
      stale = true;
    };
  }, [id, user]);


  if (s === null) {
    return (
      <Screen>
        <BackLink label={t('backToExplore')} />
        <Text variant="display">{te('generic')}</Text>
      </Screen>
    );
  }
  if (!s)
    return (
      <Screen>
        <DetailSkeleton />
      </Screen>
    );

  const state = bookingState(s, !!user, new Date(), user?.role);
  const cancelBy = new Date(new Date(s.startsAt).getTime() - CANCEL_CUTOFF_MS);

  async function act(action: 'book' | 'unbook') {
    setBusy(true);
    setError(null);
    try {
      const next = await api<SessionDetail>(`/api/sessions/${id}/${action}`, { method: 'POST', json: {} });
      setS(next);
      // The next visit opens on the booking as it is now, not as it was before this tap.
      remember(DETAIL.session(id), next);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setError(te(BOOK_ERRORS.find((c) => c === code) ?? 'generic'));
    } finally {
      setBusy(false);
    }
  }

  // Replace rather than push: after sign-in the redirect opens this page fresh, so the old copy must not stay underneath.
  const logInToBook = () => {
    setReturnTo(path);
    router.replace('/guest/sign-in');
  };

  const pills = [s.level && l.level(s.level), l.minutes(s.durationMin), l.sport(s.sport)].filter(Boolean) as string[];

  return (
    <Screen fade>
      <BackLink label={t('backToExplore')} />
      {s.coverUrl && <Image source={{ uri: s.coverUrl }} style={styles.cover} contentFit="cover" />}
      <View style={styles.hero}>
        <View style={styles.row}>
          <Tag kind={typeTagKind(s.type)} label={td(s.type === 'PRIVATE' ? 'type.private' : 'type.group')} />
          {(state === 'past' || state === 'cancelled') && <Tag kind={state === 'cancelled' ? 'warn' : 'past'} label={tst(state)} />}
        </View>
        <Text variant="display">{l.title(s)}</Text>
        <Text muted>{l.when(s.startsAt)}</Text>
      </View>

      <Card>
        {state === 'cancelled' && (
          <>
            <Text muted>{t('cancelled')}</Text>
            {s.cancelReason && <Text muted>{t('reason', { reason: s.cancelReason })}</Text>}
          </>
        )}
        {state === 'past' && <Text muted>{t('ended')}</Text>}
        {state.startsWith('booked') && (
          <>
            <Text variant="title" style={{ color: colors.accentText }}>
              {t('booked')}
            </Text>
            {user && <Text variant="label">{t('confirmation', { email: isolate(user.email) })}</Text>}
            <Button variant="secondary" label={t('viewMine')} onPress={() => router.push('/user/sessions')} />
            {state === 'bookedPrivate' && <Text variant="label">{t('privateCancel')}</Text>}
            {state === 'bookedCanCancel' && (
              <>
                <LinkText label={t('cancel')} onPress={() => !busy && act('unbook')} />
                <Text variant="label">{t('cancelUntil', { when: l.when(cancelBy) })}</Text>
              </>
            )}
            {state === 'bookedTooLate' && <Text variant="label">{t('cancelClosed')}</Text>}
          </>
        )}
        {(state === 'logIn' || state === 'notMember' || state === 'full' || state === 'reserve') && (
          <>
            <View style={styles.priceRow}>
              <Text muted>{l.spots(s)}</Text>
              <Text variant="display" style={styles.price}>
                {l.price(s.price)}
              </Text>
            </View>
            {state === 'logIn' && <Button label={t('logInToBook')} onPress={logInToBook} />}
            {state === 'full' && <Text muted>{t('full')}</Text>}
            {state === 'reserve' && <Button label={t('reserve')} onPress={() => act('book')} busy={busy} />}
            <Text variant="label">{t('payAtSession')}</Text>
          </>
        )}
        {error && <Text style={{ color: colors.warn }}>{error}</Text>}
      </Card>

      <View style={styles.row}>
        {pills.map((p) => (
          <View key={p} style={[styles.pill, { borderColor: colors.border }]}>
            <Text variant="label">{p}</Text>
          </View>
        ))}
      </View>
      {s.description && (
        <View style={styles.block}>
          <Text variant="title">{t('whatToExpect')}</Text>
          <Text muted>{s.description}</Text>
        </View>
      )}
      <View style={styles.block}>
        <Text variant="title">{t('where')}</Text>
        <Text>{s.venue.name}</Text>
        <Text muted>
          {s.venue.address} · {s.venue.city}
        </Text>
        {s.venue.mapUrl && <LinkText label={t('map')} onPress={() => Linking.openURL(s.venue.mapUrl!)} />}
      </View>
      <Pressable
        accessibilityRole="link"
        onPress={() => openPage(`/coach-profile/${s.coach.id}`)}
        style={[styles.coach, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {s.coach.photoUrl ? <Image source={{ uri: s.coach.photoUrl }} style={styles.photo} /> : <Avatar name={s.coach.name} size={48} />}
        <View style={styles.coachText}>
          <Text variant="label">{t('coach')}</Text>
          <Text>{s.coach.name}</Text>
        </View>
        <Text variant="label" style={{ color: colors.accentText }}>
          {t('profileLink')}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { height: 180, borderRadius: 16 },
  hero: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 34, lineHeight: 38 },
  pill: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7 },
  block: { gap: 6 },
  coach: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
  photo: { width: 48, height: 48, borderRadius: 24 },
  coachText: { flex: 1, gap: 2 },
});
