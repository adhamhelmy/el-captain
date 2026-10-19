import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { load, peek } from '@/api/cache';
import { PATHS } from '@/api/paths';
import type { PrivateRequest, Session } from '@/api/types';
import { openPage } from '@/nav/open';
import { RequestList } from '@/requests/RequestList';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Empty } from '@/ui/Empty';
import { LinkText } from '@/ui/LinkText';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { FadeIn, Loading, RowSkeleton } from '@/ui/Skeleton';
import { Tag, typeTagKind } from '@/ui/Tag';
import { Text } from '@/ui/Text';

type Tab = 'upcoming' | 'past' | 'requests';
const pathOf = (tab: 'upcoming' | 'past') => (tab === 'past' ? PATHS.myPast : PATHS.myUpcoming);

/** The web's /user/sessions/me: upcoming and past bookings, and private requests. */
export default function MySessions() {
  const t = useTranslations('userSessions');
  const td = useTranslations('data');
  const tst = useTranslations('status');
  const l = useSessionLabels();
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [list, setList] = useState(() => peek<Session[]>(PATHS.myUpcoming) ?? null);
  const [requests, setRequests] = useState(() => peek<PrivateRequest[]>(PATHS.myRequests) ?? null);

  useFocusEffect(
    useCallback(() => {
      let stale = false;
      if (tab === 'requests') {
        load<PrivateRequest[]>(PATHS.myRequests)
          .catch(() => [])
          .then((r) => !stale && setRequests(r));
      } else {
        load<Session[]>(pathOf(tab))
          .catch(() => [])
          .then((r) => !stale && setList(r));
      }
      return () => {
        stale = true;
      };
    }, [tab]),
  );

  const switchTab = (next: Tab) => {
    if (next !== 'requests') setList(peek<Session[]>(pathOf(next)) ?? null);
    setTab(next);
  };
  const skeleton = (
    <Loading style={styles.list}>
      <RowSkeleton lines={3} />
      <RowSkeleton lines={3} />
      <RowSkeleton lines={3} />
    </Loading>
  );

  return (
    <Screen>
      <Text variant="display">{t('title')}</Text>
      <Segmented
        label={t('title')}
        value={tab}
        onChange={switchTab}
        options={[
          { value: 'upcoming' as const, label: t('upcoming') },
          { value: 'past' as const, label: t('past') },
          { value: 'requests' as const, label: t('requests') },
        ]}
      />
      {tab === 'requests' ? (
        requests ? (
          <FadeIn>
            <RequestList role="member" requests={requests} onChange={(r) => setRequests(requests.map((x) => (x.id === r.id ? r : x)))} />
          </FadeIn>
        ) : (
          skeleton
        )
      ) : list === null ? (
        skeleton
      ) : (
        <FadeIn key={tab} style={styles.list}>
          {list.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="link"
              onPress={() => openPage(`/session/${s.id}`)}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.top}>
                <Tag kind={typeTagKind(s.type)} label={td(s.type === 'PRIVATE' ? 'type.private' : 'type.group')} />
                {s.status === 'CANCELLED' && <Tag kind="warn" label={tst('cancelled')} />}
                <Text variant="title" style={styles.price}>
                  {l.price(s.price)}
                </Text>
              </View>
              <Text style={styles.title}>{l.title(s)}</Text>
              <Text variant="label">
                {s.coach.name} · {l.when(s.startsAt)}
              </Text>
              {tab === 'past' && <LinkText label={t('bookAgain')} onPress={() => openPage(`/coach-profile/${s.coach.id}`)} />}
            </Pressable>
          ))}
          {list.length === 0 && <Empty text={(link) => t.rich('empty', { link })} link={() => router.push('/user/explore')} />}
        </FadeIn>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: { borderWidth: 1, borderRadius: radius.row, padding: 16, gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { marginStart: 'auto' },
  title: { fontSize: 16 },
});
