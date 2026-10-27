import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import type { Session } from '@/api/types';
import { openPage } from '@/nav/open';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Stripes } from '@/ui/Stripes';
import { Tag, typeTagKind } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { useSessionLabels } from './labels';

/** The web's SessionCard: cover or stripes with sport and type, then title, coach · place, start and price. */
export function SessionCard({ s }: Readonly<{ s: Session }>) {
  const { colors } = useTheme();
  const l = useSessionLabels();
  const td = useTranslations('data');
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => openPage(`/session/${s.id}`)}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.head}>
        {s.coverUrl ? (
          <>
            <Image source={{ uri: s.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={[StyleSheet.absoluteFill, styles.shade]} />
          </>
        ) : (
          <Stripes />
        )}
        <Text variant="title" style={[styles.cat, { color: s.coverUrl ? colors.accent : colors.accentText }]}>
          {l.sport(s.sport)}
        </Text>
        <Tag kind={typeTagKind(s.type)} label={td(s.type === 'PRIVATE' ? 'type.private' : 'type.group')} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{l.title(s)}</Text>
        <Text variant="label">
          {s.coach.name} · {s.venue.name}
        </Text>
        <View style={[styles.foot, { borderTopColor: colors.border }]}>
          <Text variant="label">{l.when(s.startsAt)}</Text>
          <Text variant="label" style={{ color: colors.text }}>
            {l.price(s.price)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.card + 2, overflow: 'hidden' },
  head: { height: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, overflow: 'hidden' },
  shade: { backgroundColor: 'rgba(14, 18, 0, 0.5)' },
  cat: { fontSize: 40, lineHeight: 44 },
  body: { padding: 18, gap: 6 },
  title: { fontSize: 17 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 12, marginTop: 6 },
});
