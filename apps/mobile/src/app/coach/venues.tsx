import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import type { CoachVenue } from '@/api/types';
import { cachedVenues, myVenues } from '@/coach/data';
import { VenueForm, type VenueSaved } from '@/coach/VenueForm';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { BackLink } from '@/ui/BackLink';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { LinkText } from '@/ui/LinkText';
import { Screen } from '@/ui/Screen';
import { Sheet } from '@/ui/Sheet';
import { FadeIn, Loading, RowSkeleton } from '@/ui/Skeleton';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';

/** The web's Locations page: add and edit in a sheet; the coach always keeps at least one. */
export default function Venues() {
  const t = useTranslations('venues');
  const tb = useTranslations('onboarding');
  const { colors } = useTheme();
  const [venues, setVenues] = useState<CoachVenue[] | null>(cachedVenues);
  const [open, setOpen] = useState<CoachVenue | 'new' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let stale = false;
      void myVenues().then((v) => !stale && setVenues(v));
      return () => {
        stale = true;
      };
    }, []),
  );

  function saved({ venue, action }: VenueSaved) {
    const list = venues ?? [];
    const next = { ...venue, upcoming: list.find((v) => v.id === venue.id)?.upcoming ?? 0 };
    setVenues(action === 'added' ? [...list, next] : list.map((v) => (v.id === venue.id ? next : v)));
    setNotice(t(action === 'archived' ? 'archivedNotice' : action, { name: venue.name }));
    setOpen(null);
  }

  return (
    <Screen>
      <BackLink label={tb('back')} />
      <Text variant="display">{t('title')}</Text>
      <Text muted>{t('sub')}</Text>
      <Button label={t('add')} onPress={() => setOpen('new')} />
      {notice && (
        <Pressable onPress={() => setNotice(null)} accessibilityRole="alert" style={[styles.notice, { borderColor: colors.accentText, backgroundColor: colors.accentTint }]}>
          <Text>{notice}</Text>
        </Pressable>
      )}

      {venues?.length === 0 && (
        <Card style={styles.gap}>
          <Text variant="title">{t('emptyTitle')}</Text>
          <Text muted>{t('emptyBody')}</Text>
          <Button label={t('addFirst')} onPress={() => setOpen('new')} />
        </Card>
      )}

      {venues === null && (
        <Loading>
          <RowSkeleton />
          <RowSkeleton />
        </Loading>
      )}
      {venues && venues.length > 0 && (
        <FadeIn>
        {venues.map((v) => (
          <Card key={v.id} style={styles.gap}>
            <View style={styles.top}>
              <View style={styles.grow}>
                <Text style={styles.name}>{v.name}</Text>
                <Text variant="label">{t('line', { address: v.address, city: v.city })}</Text>
              </View>
              {v.archived ? <Tag kind="past" label={t('archived')} /> : <LinkText label={t('edit')} onPress={() => setOpen(v)} />}
            </View>
            {(v.mapUrl || v.upcoming > 0) && (
              <View style={styles.meta}>
                {v.mapUrl && <LinkText label={t('map')} onPress={() => Linking.openURL(v.mapUrl!).catch(() => {})} />}
                {v.upcoming > 0 && <Text variant="label">{t('upcoming', { count: v.upcoming })}</Text>}
              </View>
            )}
          </Card>
        ))}
        </FadeIn>
      )}

      <Sheet visible={!!open} title={open === 'new' ? t('newTitle') : t('editTitle')} onClose={() => setOpen(null)}>
        {open && <VenueForm venue={open === 'new' ? undefined : open} onSaved={saved} onCancel={() => setOpen(null)} />}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  gap: { gap: 10 },
  notice: { borderWidth: 1, borderRadius: radius.card, padding: 14 },
  top: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  name: { fontSize: 16 },
  meta: { flexDirection: 'row', gap: 14, alignItems: 'center' },
});
