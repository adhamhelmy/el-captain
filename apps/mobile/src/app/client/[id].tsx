import { hasStarted } from '@el-captain/rules/session-rules';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { load, peek } from '@/api/cache';
import { DETAIL } from '@/api/paths';
import type { CoachClientDetail } from '@/api/types';
import { clientSummary } from '@/coach/session-form';
import { openPage } from '@/nav/open';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { BackLink } from '@/ui/BackLink';
import { Screen } from '@/ui/Screen';
import { DetailSkeleton } from '@/ui/Skeleton';
import { Stats } from '@/ui/Stats';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';

/** The web's client page: how long they've trained with the coach, what they've spent, and every session together. */
export default function ClientPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTranslations('clients');
  const te = useTranslations('errors');
  const l = useSessionLabels();
  const f = useFormatter();
  const { colors } = useTheme();
  const [c, setC] = useState<CoachClientDetail | null | undefined>(() => peek<CoachClientDetail>(DETAIL.client(id)));

  useEffect(() => {
    let stale = false;
    load<CoachClientDetail>(DETAIL.client(id))
      .then((r) => !stale && setC(r))
      // Offline with this page already showing from the cache: keep it rather than swap in the error.
      .catch(() => !stale && setC((shown) => shown ?? null));
    return () => {
      stale = true;
    };
  }, [id]);

  if (c === null) {
    return (
      <Screen>
        <BackLink label={t('back')} />
        <Text variant="display">{te('generic')}</Text>
      </Screen>
    );
  }
  if (!c)
    return (
      <Screen>
        <DetailSkeleton />
      </Screen>
    );
  const sum = clientSummary(c.sessions);

  return (
    <Screen fade>
      <BackLink label={t('back')} />
      <View style={styles.profile}>
        <Avatar name={c.member.name} size={72} />
        <View style={styles.grow}>
          <Text variant="display">{c.member.name}</Text>
          <Text muted>{sum.first ? t('clientSince', { date: l.monthYear(sum.first.startsAt) }) : c.member.email}</Text>
        </View>
      </View>
      <Stats
        items={[
          [sum.attended, t('withYou')],
          [sum.upcoming, t('upcoming')],
          [f.number(sum.spent), t('spent'), t('egp')],
        ]}
      />
      <Text variant="title">{t('history')}</Text>
      {c.sessions.map((s) => {
        let tag = <Tag kind="accent" label={t('upcomingTag')} />;
        if (s.status === 'CANCELLED') tag = <Tag kind="warn" label={t('cancelledTag')} />;
        else if (hasStarted(s.startsAt)) tag = <Tag kind="past" label={t('attendedTag')} />;
        return (
          <Pressable
            key={s.id}
            accessibilityRole="link"
            onPress={() => openPage(`/coach-session/${s.id}`)}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.grow}>
              <Text numberOfLines={1}>{l.title(s)}</Text>
              <Text variant="label">{l.when(s.startsAt)}</Text>
            </View>
            {tag}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radius.card, padding: 14 },
});
