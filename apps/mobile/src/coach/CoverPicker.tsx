import { Image } from 'expo-image';
import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Stripes } from '@/ui/Stripes';
import { Text } from '@/ui/Text';
import { pickImage } from '@/uploads/pick';
import { uploadFile } from '@/uploads/upload';

/** The web's CoverUpload: the cover banner is its own button with a pencil badge; the parent saves the returned path. */
export function CoverPicker({
  userId,
  url,
  onUploaded,
  onBusy,
}: {
  userId: string;
  url: string | null;
  onUploaded: (path: string, previewUrl: string) => void;
  onBusy?: (busy: boolean) => void;
}) {
  const t = useTranslations('coachEdit');
  const to = useTranslations('onboarding');
  const te = useTranslations('errors');
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'invalid_upload' | 'generic' | null>(null);

  async function pick() {
    const file = await pickImage([3, 1]);
    if (!file) return;
    setBusy(true);
    onBusy?.(true);
    setError(null);
    const res = await uploadFile('cover', userId, file);
    setBusy(false);
    onBusy?.(false);
    if (!res.ok) return setError(res.code);
    onUploaded(res.path, file.uri);
  }

  let label = t('coverAdd');
  if (busy) label = to('uploading');
  else if (url) label = t('coverReplace');

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={busy}
        onPress={pick}
        style={[styles.cover, { borderColor: colors.border, opacity: busy ? 0.6 : 1 }]}>
        {url ? (
          <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <>
            <Stripes />
            <Text variant="label" style={styles.hint}>
              {busy ? label : t('coverHint')}
            </Text>
          </>
        )}
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Pencil size={13} color={colors.onAccent} />
        </View>
      </Pressable>
      {error && <Text style={{ color: colors.warn }}>{te(error)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  cover: { height: 130, borderWidth: 1, borderRadius: radius.card, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  hint: { textAlign: 'center', paddingHorizontal: 24 },
  badge: { position: 'absolute', bottom: 10, end: 10, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
