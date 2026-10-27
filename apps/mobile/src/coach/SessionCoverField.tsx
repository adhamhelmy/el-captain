import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { api } from '@/api/client';
import type { Media, Onboarding } from '@/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { LinkText } from '@/ui/LinkText';
import { Text } from '@/ui/Text';
import { pickImage } from '@/uploads/pick';
import { uploadFile } from '@/uploads/upload';

/** What the session form sends for its cover: a new upload's path, a gallery photo's id, or null to remove it. */
export type CoverChoice = { url: string | null; body: { coverPath: string | null } | { coverMediaId: string } };

/**
 * The web's SessionCoverField: a preview, then Upload photo, Choose from your photos (the coach's gallery, loaded the
 * first time it opens) and Remove. Optional; nothing is sent until the coach changes it.
 */
export function SessionCoverField({
  coachId,
  url,
  onChange,
  onGoToPhotos,
  onBusy,
}: Readonly<{
  coachId: string;
  url: string | null;
  onChange: (c: CoverChoice) => void;
  onGoToPhotos: () => void;
  /** Told while an upload runs, so the form waits before publishing. */
  onBusy?: (busy: boolean) => void;
}>) {
  const t = useTranslations('schedule');
  const to = useTranslations('onboarding');
  const te = useTranslations('errors');
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [photos, setPhotos] = useState<Media[] | null>(null);

  async function upload() {
    const file = await pickImage([16, 9]);
    if (!file) return;
    setBusy(true);
    onBusy?.(true);
    setError(null);
    const res = await uploadFile('sessionCover', coachId, file);
    setBusy(false);
    onBusy?.(false);
    if (!res.ok) return setError(te(res.code));
    setPicking(false);
    onChange({ url: file.uri, body: { coverPath: res.path } });
  }

  function openGallery() {
    setPicking(!picking);
    if (photos) return;
    api<Onboarding>('/api/coaches/me/onboarding')
      .then((r) => setPhotos(r.coach.media.filter((m) => m.kind === 'PHOTO')))
      .catch(() => setPhotos([]));
  }

  let gallery = <Text variant="label">{to('uploading')}</Text>;
  if (photos?.length === 0) gallery = <LinkText label={t('coverNoPhotos')} onPress={onGoToPhotos} />;
  else if (photos)
    gallery = (
      <View style={styles.grid}>
        {photos.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={m.caption ?? t('coverPhoto')}
            onPress={() => {
              setPicking(false);
              onChange({ url: m.url, body: { coverMediaId: m.id } });
            }}
            style={[styles.tile, { borderColor: m.url === url ? colors.accentText : colors.border }]}>
            <Image source={{ uri: m.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </Pressable>
        ))}
      </View>
    );

  return (
    <View style={styles.field}>
      <Text variant="label">{t('coverOptional')}</Text>
      <View style={[styles.preview, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
        {url ? <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text variant="label" style={styles.empty}>{t('coverEmpty')}</Text>}
      </View>
      <View style={styles.actions}>
        <LinkText label={busy ? to('uploading') : t('coverUpload')} onPress={busy ? () => {} : upload} />
        <LinkText label={t('coverChoose')} onPress={openGallery} />
        {url && <LinkText label={to('remove')} muted onPress={() => onChange({ url: null, body: { coverPath: null } })} />}
      </View>
      {picking && gallery}
      {error && <Text style={{ color: colors.warn }}>{error}</Text>}
    </View>
  );
}

/** Where "add photos first" takes the coach: their profile, where photos & videos live. */
export const goToPhotos = () => router.push('/coach/profile');

const styles = StyleSheet.create({
  field: { gap: 8 },
  preview: { height: 140, borderWidth: 1, borderRadius: radius.card, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', paddingHorizontal: 24 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: 88, height: 88, borderRadius: 8, borderWidth: 2, overflow: 'hidden' },
});
