import { sportName } from '@el-captain/rules/coach-rules';
import { Image } from 'expo-image';
import { MapPin, Star } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import type { PublicCoach } from '@/api/types';
import { useLocale } from '@/i18n/IntlProvider';
import { openPage } from '@/nav/open';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Stripes } from '@/ui/Stripes';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';

/** The profile city, or else the cities of the coach's venues (as the web's placeOf). */
const placeOf = (c: PublicCoach) => c.city || [...new Set(c.venues.map((v) => v.city).filter(Boolean))].join(' · ');

/** The web's ExploreCoachCard: photo and (not yet) rating, name, sports, where they train. */
export function CoachCard({ c }: Readonly<{ c: PublicCoach }>) {
  const t = useTranslations('explore');
  const { colors } = useTheme();
  const { locale } = useLocale();
  const place = placeOf(c);
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => openPage(`/coach-profile/${c.id}`)}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.head}>
        <Stripes />
        {c.photoUrl ? <Image source={{ uri: c.photoUrl }} style={styles.photo} contentFit="cover" /> : <Avatar name={c.name} />}
        <View style={[styles.noReviews, { backgroundColor: colors.pastTint }]}>
          <Star size={12} color={colors.text2} />
          <Text variant="label" style={styles.small}>
            {t('noReviews')}
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{c.name}</Text>
        {c.sports.length > 0 && (
          <View style={styles.tags}>
            {c.sports.map((s) => (
              <Tag key={s.id} label={sportName(s, locale)} />
            ))}
          </View>
        )}
        <View style={[styles.foot, { borderTopColor: colors.border }]}>
          <MapPin size={14} color={colors.text2} />
          <Text variant="label">{place || t('noLocation')}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.card + 2, overflow: 'hidden' },
  head: { height: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, overflow: 'hidden' },
  photo: { width: 64, height: 64, borderRadius: 32 },
  noReviews: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  small: { fontSize: 12 },
  body: { padding: 18, gap: 8 },
  title: { fontSize: 17 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
});
