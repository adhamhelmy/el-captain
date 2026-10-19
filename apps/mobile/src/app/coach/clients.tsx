import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { load, peek } from '@/api/cache';
import { PATHS } from '@/api/paths';
import type { CoachClient } from '@/api/types';
import { openPage } from '@/nav/open';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Screen } from '@/ui/Screen';
import { FadeIn, Loading, RowSkeleton } from '@/ui/Skeleton';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';

/** The web's My clients: everyone who booked this coach, searchable by name or email. */
export default function Clients() {
  const t = useTranslations('clients');
  const l = useSessionLabels();
  const { colors } = useTheme();
  const [list, setList] = useState(() => peek<CoachClient[]>(PATHS.clients) ?? null);
  const [q, setQ] = useState('');

  useFocusEffect(
    useCallback(() => {
      let stale = false;
      load<CoachClient[]>(PATHS.clients)
        .then((r) => !stale && setList(r))
        .catch(() => !stale && setList([]));
      return () => {
        stale = true;
      };
    }, []),
  );

  const needle = q.trim().toLowerCase();
  const shown = (list ?? []).filter((c) => !needle || c.member.name.toLowerCase().includes(needle) || c.member.email.toLowerCase().includes(needle));
  const last = (c: CoachClient) => (c.lastVisit ? l.dayMonth(c.lastVisit) : '—');

  return (
    <Screen>
      <Text variant="display">{t('title')}</Text>
      <Text muted>{t('sub')}</Text>
      <TextField label={t('search')} value={q} onChangeText={setQ} placeholder={t('search')} autoCapitalize="none" autoCorrect={false} />
      {list === null ? (
        <Loading>
          <RowSkeleton lead="avatar" />
          <RowSkeleton lead="avatar" />
          <RowSkeleton lead="avatar" />
        </Loading>
      ) : (
        <FadeIn>
        {shown.map((c) => (
          <Pressable
            key={c.member.id}
            accessibilityRole="link"
            onPress={() => openPage(`/client/${c.member.id}`)}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Avatar name={c.member.name} size={36} />
            <View style={styles.grow}>
              <Text style={styles.name}>{c.member.name}</Text>
              <Text variant="label">{t('lastAndSince', { last: last(c), since: l.monthYear(c.since) })}</Text>
            </View>
            <Text variant="display" style={styles.count}>
              {c.count}
            </Text>
          </Pressable>
        ))}
        </FadeIn>
      )}
      {list && shown.length === 0 && <Text muted>{list.length ? t('noMatch') : t('none')}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radius.card, padding: 14 },
  name: { fontSize: 15 },
  count: { fontSize: 26, lineHeight: 28 },
});
