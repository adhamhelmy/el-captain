import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslations } from 'use-intl';
import { load, peek } from '@/api/cache';
import { PATHS } from '@/api/paths';
import type { MemberCoach } from '@/api/types';
import { openPage } from '@/nav/open';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Empty } from '@/ui/Empty';
import { Screen } from '@/ui/Screen';
import { FadeIn, Loading, RowSkeleton } from '@/ui/Skeleton';
import { Text } from '@/ui/Text';

/** The web's /user/coaches/me: coaches the member has trained with. */
export default function MyCoaches() {
  const t = useTranslations('userCoaches');
  const { colors } = useTheme();
  const [list, setList] = useState(() => peek<MemberCoach[]>(PATHS.myCoaches) ?? null);

  useFocusEffect(
    useCallback(() => {
      let stale = false;
      load<MemberCoach[]>(PATHS.myCoaches)
        .catch(() => [])
        .then((r) => !stale && setList(r));
      return () => {
        stale = true;
      };
    }, []),
  );

  return (
    <Screen>
      <Text variant="display">{t('mineTitle')}</Text>
      <Text muted>{t('mineSub')}</Text>
      {list === null ? (
        <Loading>
          <RowSkeleton lead="avatar" />
          <RowSkeleton lead="avatar" />
          <RowSkeleton lead="avatar" />
        </Loading>
      ) : (
        <FadeIn>
          {list.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="link"
              onPress={() => openPage(`/coach-profile/${c.id}`)}
              style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {c.photoUrl ? <Image source={{ uri: c.photoUrl }} style={styles.photo} /> : <Avatar name={c.name} size={52} />}
              <View style={styles.text}>
                <Text style={styles.name}>{c.name}</Text>
                {c.city && <Text variant="label">{c.city}</Text>}
              </View>
              <Text variant="label">{t('together', { count: c.count })}</Text>
            </Pressable>
          ))}
          {list.length === 0 && <Empty text={(link) => t.rich('none', { link })} link={() => router.push('/user/explore')} />}
        </FadeIn>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radius.row, padding: 14 },
  photo: { width: 52, height: 52, borderRadius: 26 },
  text: { flex: 1, gap: 2 },
  name: { fontSize: 16 },
});
