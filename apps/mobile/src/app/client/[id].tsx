import { hasStarted } from '@el-captain/rules/session-rules';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { api } from '@/api/client';
import type { CoachClientDetail } from '@/api/types';
import { clientSummary } from '@/coach/session-form';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { BackLink } from '@/ui/BackLink';
import { Screen } from '@/ui/Screen';
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
  const [c, setC] = useState<CoachClientDetail | null | undefined>(undefined);

  useEffect(() => {
    let stale = false;
    api<CoachClientDetail>(`/api/coaches/me/clients/${id}`)
      .then((r) => !stale && setC(r))
      .catch(() => !stale && setC(null));
    return () => {
      stale = true;
    };
  }, [id]);

  if (c === null) {
    return (
      <Screen tabs={false}>
        <BackLink label={t('back')} />
        <Text variant="display">{te('generic')}</Text>
      </Screen>
    );
  }
  if (!c) return <Screen tabs={false}>{null}</Screen>;
  const sum = clientSummary(c.sessions);

  return (
    <Screen tabs={false}>
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
            onPress={() => router.push(`/coach-session/${s.id}` as Href)}
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
