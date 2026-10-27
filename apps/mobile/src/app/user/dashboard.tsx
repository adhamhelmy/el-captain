import { router, useFocusEffect } from 'expo-router';
import { CalendarCheck } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslations } from 'use-intl';
import { load, peek } from '@/api/cache';
import { PATHS } from '@/api/paths';
import type { Member, MemberCoach, Session } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { openPage } from '@/nav/open';
import { useSessionLabels } from '@/sessions/labels';
import { pickedForYou } from '@/sessions/picked';
import { SessionCard } from '@/sessions/SessionCard';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Empty } from '@/ui/Empty';
import { Screen } from '@/ui/Screen';
import { SectionHead } from '@/ui/SectionHead';
import { Bone, CardSkeleton, FadeIn, Loading, StatsSkeleton } from '@/ui/Skeleton';
import { Stats } from '@/ui/Stats';
import { Text } from '@/ui/Text';

/** Bookings listed under the next-session card; the rest are on My sessions (as the web's). */
const MORE_SHOWN = 6;
const isolate = (s: string) => `⁨${s}⁩`;
const list = <T,>(path: string) => load<T[]>(path).catch(() => [] as T[]);

/** Picks from what the last visit (or sign-in) already loaded, so the section opens filled in. */
function cachedPicks() {
  const [open, mine, me] = [peek<Session[]>(PATHS.openSessions), peek<Session[]>(PATHS.myUpcoming), peek<Member>(PATHS.me)];
  return open && mine ? pickedForYou(open, mine, me?.sports.map((s) => s.id) ?? []) : null;
}

/** The web's /user/dashboard. Reloads whenever the tab comes back into view, so a booking made elsewhere shows. */
export default function Dashboard() {
  const t = useTranslations('userDashboard');
  const tn = useTranslations('nav');
  const l = useSessionLabels();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState(() => peek<Session[]>(PATHS.myUpcoming) ?? null);
  const [completed, setCompleted] = useState(() => peek<Session[]>(PATHS.myPast)?.length ?? null);
  const [coaches, setCoaches] = useState(() => peek<MemberCoach[]>(PATHS.myCoaches)?.length ?? null);
  const [picked, setPicked] = useState(cachedPicks);

  useFocusEffect(
    useCallback(() => {
      let stale = false;
      void list<Session>(PATHS.myPast).then((r) => !stale && setCompleted(r.length));
      void list<MemberCoach>(PATHS.myCoaches).then((r) => !stale && setCoaches(r.length));
      void Promise.all([list<Session>(PATHS.myUpcoming), load<Member>(PATHS.me).catch(() => null), list<Session>(PATHS.openSessions)]).then(([mine, me, open]) => {
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
      {upcoming === null && <Bone height={150} round={radius.card + 4} />}
      {next && (
        <FadeIn>
          <Pressable
            accessibilityRole="link"
            onPress={() => openPage(`/session/${next.id}`)}
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
        </FadeIn>
      )}
      {upcoming === null || completed === null || coaches === null ? (
        <StatsSkeleton />
      ) : (
        <FadeIn>
          <Stats
            items={[
              [upcoming.length, t('stats.upcoming')],
              [completed, t('stats.completed')],
              [coaches, t('stats.coaches')],
            ]}
          />
        </FadeIn>
      )}
      {/* Members have no My sessions tab, so this is the way to every booking, past ones and requests too. */}
      <Button label={tn('mySessions')} icon={CalendarCheck} variant="secondary" onPress={() => router.push('/user/sessions')} />
      {upcoming && (upcoming.length === 0 || later.length > 0) && (
        <>
          <SectionHead title={t('comingUp')} />
          <FadeIn>
            {later.slice(0, MORE_SHOWN).map((s) => (
              <SessionCard key={s.id} s={s} />
            ))}
            {upcoming.length === 0 && <Empty text={(link) => t.rich('noUpcoming', { link })} link={toExplore} />}
          </FadeIn>
        </>
      )}
      <SectionHead title={t('picked')} link={t('exploreAll')} onPress={toExplore} />
      {picked === null ? (
        <Loading>
          <CardSkeleton />
          <CardSkeleton />
        </Loading>
      ) : (
        <FadeIn>
          {picked.map((s) => (
            <SessionCard key={s.id} s={s} />
          ))}
        </FadeIn>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  next: { borderRadius: radius.card + 4, padding: 20, gap: 6 },
  nextTitle: { fontSize: 36, lineHeight: 38 },
});
