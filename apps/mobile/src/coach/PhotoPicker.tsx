import { Image } from 'expo-image';
import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/ui/Text';
import { pickImage } from '@/uploads/pick';
import { uploadFile } from '@/uploads/upload';

/**
 * The web's PhotoUpload: the round photo is its own button, with a pencil badge. Picks a square photo, uploads it,
 * and hands the parent the path to save with the rest of the form, plus the local picture to show meanwhile.
 */
export function PhotoPicker({
  userId,
  url,
  warn,
  onUploaded,
  onBusy,
}: {
  userId: string;
  url: string | null;
  warn?: boolean;
  onUploaded: (path: string, previewUrl: string) => void;
  /** Told while an upload runs, so the screen can wait before saving or moving on. */
  onBusy?: (busy: boolean) => void;
}) {
  const t = useTranslations('onboarding');
  const te = useTranslations('errors');
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'invalid_upload' | 'generic' | null>(null);

  async function pick() {
    const file = await pickImage([1, 1]);
    if (!file) return;
    setBusy(true);
    onBusy?.(true);
    setError(null);
    const res = await uploadFile('photo', userId, file);
    setBusy(false);
    onBusy?.(false);
    if (!res.ok) return setError(res.code);
    onUploaded(res.path, file.uri);
  }

  let label = t('upload');
  if (busy) label = t('uploading');
  else if (url) label = t('replace');

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          disabled={busy}
          onPress={pick}
          style={[styles.photo, { backgroundColor: colors.surface2, borderColor: warn && !url ? colors.warn : colors.border, opacity: busy ? 0.6 : 1 }]}>
          {url ? <Image source={{ uri: url }} style={styles.image} contentFit="cover" /> : <Text style={[styles.plus, { color: colors.text2 }]}>+</Text>}
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Pencil size={13} color={colors.onAccent} />
          </View>
        </Pressable>
        <View style={styles.grow}>
          <Text style={{ color: colors.accentText }} onPress={busy ? undefined : pick}>
            {label}
          </Text>
          <Text variant="label">{t('photoHint')}</Text>
        </View>
      </View>
      {error && <Text style={{ color: colors.warn }}>{te(error)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  grow: { flex: 1, gap: 4 },
  photo: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: 94, height: 94, borderRadius: 47 },
  plus: { fontSize: 32 },
  badge: { position: 'absolute', bottom: 2, end: 2, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
