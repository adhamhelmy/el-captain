import { sportName } from '@el-captain/rules/coach-rules';
import type { CoachForm } from '@el-captain/rules/coach-form';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import type { Sport } from '@/api/types';
import { useLocale } from '@/i18n/IntlProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Stripes } from '@/ui/Stripes';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';

/** The web's ProfilePreview: "what members see", the coach's public card, updated as they type. */
export function ProfilePreview({ name, form }: Readonly<{ name: string; form: CoachForm<Sport, unknown> }>) {
  const t = useTranslations('onboarding');
  const { locale } = useLocale();
  const { colors } = useTheme();
  const address = form.address.trim();
  const bio = form.bio.trim();
  const social = [
    form.instagram.trim() && t('onInstagram', { handle: form.instagram.trim().replace(/^@/, '') }),
    form.tiktok.trim() && t('onTiktok', { handle: form.tiktok.trim().replace(/^@/, '') }),
  ].filter(Boolean);
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.banner}>
        <Stripes />
      </View>
      <View style={styles.body}>
        {form.photoUrl ? (
          <Image source={{ uri: form.photoUrl }} style={[styles.photo, { borderColor: colors.surface }]} contentFit="cover" />
        ) : (
          <View style={[styles.photo, styles.noPhoto, { backgroundColor: colors.surface2, borderColor: colors.surface }]}>
            <Text variant="label">{t('previewPhoto')}</Text>
          </View>
        )}
        <Text style={styles.name}>{name}</Text>
        <Text variant="label">{address ? t('previewPlace', { address }) : t('previewCoach')}</Text>
        {form.sports.length > 0 && (
          <View style={styles.tags}>
            {form.sports.map((s) => (
              <Tag key={s.id} label={sportName(s, locale)} />
            ))}
          </View>
        )}
        <Text muted={!bio}>{bio || t('previewBio')}</Text>
        {social.length > 0 && <Text variant="label">{social.join(' · ')}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.card + 2, overflow: 'hidden' },
  banner: { height: 64, overflow: 'hidden' },
  body: { padding: 16, paddingTop: 0, gap: 8 },
  photo: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, marginTop: -36 },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
