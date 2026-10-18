import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslations } from 'use-intl';
import { api } from '@/api/client';
import type { Member, MemberCoach, Session } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { useSessionLabels } from '@/sessions/labels';
import { pickedForYou } from '@/sessions/picked';
import { SessionCard } from '@/sessions/SessionCard';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Empty } from '@/ui/Empty';
import { Screen } from '@/ui/Screen';
import { SectionHead } from '@/ui/SectionHead';
import { Stats } from '@/ui/Stats';
import { Text } from '@/ui/Text';

/** Bookings listed under the next-session card; the rest are on My sessions (as the web's). */
const MORE_SHOWN = 6;
const isolate = (s: string) => `⁨${s}⁩`;
const list = <T,>(path: string) => api<T[]>(path).catch(() => [] as T[]);

/** The web's /user/dashboard. Reloads whenever the tab comes back into view, so a booking made elsewhere shows. */
export default function Dashboard() {
  const t = useTranslations('userDashboard');
  const l = useSessionLabels();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<Session[] | null>(null);
  const [completed, setCompleted] = useState(0);
  const [coaches, setCoaches] = useState(0);
  const [picked, setPicked] = useState<Session[]>([]);

  useFocusEffect(
    useCallback(() => {
      let stale = false;
      list<Session>('/api/sessions/me?when=past&limit=50').then((r) => !stale && setCompleted(r.length));
      list<MemberCoach>('/api/users/me/coaches').then((r) => !stale && setCoaches(r.length));
      Promise.all([
        list<Session>('/api/sessions/me?when=upcoming&limit=50'),
        api<Member>('/api/users/me').catch(() => null),
        list<Session>('/api/sessions?limit=24'),
      ]).then(([mine, me, open]) => {
        if (stale) return;
        setUpcoming(mine);
        setPicked(pickedForYou(open, mine, me?.sports.map((s) => s.id) ?? []));
      });
      return () => {
        stale = true;
      };
    }, []),
  );

  const [next, ...later] = upcoming ?? [];
  const toExplore = () => router.push('/user/explore');

  return (
    <Screen>
      <Text variant="label">{t('welcome')}</Text>
      <Text variant="display">{t('title', { name: isolate((user?.name ?? '').split(' ')[0].toUpperCase()) })}</Text>
      {next && (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push(`/session/${next.id}` as Href)}
          style={[styles.next, { backgroundColor: colors.accent }]}>
          <Text variant="eyebrow" style={{ color: colors.onAccent }}>
            {t('nextSession')}
          </Text>
          <Text variant="display" style={[styles.nextTitle, { color: colors.onAccent }]}>
            {l.title(next)}
          </Text>
          <Text style={{ color: colors.onAccent }}>
            {next.coach.name} · {l.when(next.startsAt)}
          </Text>
          <Text variant="label" style={{ color: colors.onAccent }}>
            {t('viewDetails')}
          </Text>
        </Pressable>
      )}
      <Stats
        items={[
          [upcoming?.length ?? 0, t('stats.upcoming')],
          [completed, t('stats.completed')],
          [coaches, t('stats.coaches')],
        ]}
      />
      {upcoming && (upcoming.length === 0 || later.length > 0) && (
        <>
          <SectionHead title={t('comingUp')} link={t('mySessions')} onPress={() => router.push('/user/sessions')} />
          {later.slice(0, MORE_SHOWN).map((s) => (
            <SessionCard key={s.id} s={s} />
          ))}
          {upcoming.length === 0 && <Empty text={(link) => t.rich('noUpcoming', { link })} link={toExplore} />}
        </>
      )}
      <SectionHead title={t('picked')} link={t('exploreAll')} onPress={toExplore} />
      {picked.map((s) => (
        <SessionCard key={s.id} s={s} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  next: { borderRadius: radius.card + 4, padding: 20, gap: 6 },
  nextTitle: { fontSize: 36, lineHeight: 38 },
});
