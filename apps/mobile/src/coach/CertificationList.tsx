import { CERT_TITLE_MAX, MAX_CERTS, UPLOAD_RULES } from '@el-captain/rules/coach-rules';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { api, ApiError } from '@/api/client';
import type { CoachMe } from '@/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { LinkText } from '@/ui/LinkText';
import { Text } from '@/ui/Text';
import { pickDocuments } from '@/uploads/pick';
import { uploadFile } from '@/uploads/upload';

export type Certification = CoachMe['certifications'][number];

const KNOWN_ERRORS = ['invalid_upload', 'invalid_profile', 'profile_locked', 'network'] as const;
const errorKey = (code?: string) => KNOWN_ERRORS.find((c) => c === code) ?? 'generic';
/** The certificate's name, from its file name without the extension. */
const titleOf = (fileName: string) => fileName.replace(/\.[^.]+$/, '').trim().slice(0, CERT_TITLE_MAX) || fileName.slice(0, CERT_TITLE_MAX);
/** The badge on each row: PDF, JPG, PNG… */
const badgeOf = (c: Certification) => (c.contentType === 'application/pdf' ? 'PDF' : (c.fileName.split('.').pop() ?? '').toUpperCase().slice(0, 4));

/**
 * The web's CertificationList: pick files, each uploaded and saved right away. Viewing a file stays on the web for
 * now (its route reads the web login, not the app's token).
 */
export function CertificationList({ coachId, items, onChange }: { coachId: string; items: Certification[]; onChange: (c: Certification[]) => void }) {
  const t = useTranslations('onboarding');
  const te = useTranslations('errors');
  const f = useFormatter();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Uploads one file after another, so the list grows in the order they were picked. */
  async function add() {
    const files = await pickDocuments(UPLOAD_RULES.certificate.types);
    if (!files.length) return;
    setBusy(true);
    setError(null);
    let list = items;
    for (const file of files.slice(0, MAX_CERTS - items.length)) {
      const up = await uploadFile('certificate', coachId, file);
      if (!up.ok) {
        setError(te(up.code));
        break;
      }
      try {
        const saved = await api<Certification>(`/api/coaches/${coachId}/certifications`, {
          method: 'POST',
          json: { title: titleOf(file.name), filePath: up.path, fileName: file.name },
        });
        list = [...list, saved];
        onChange(list);
      } catch (e) {
        setError(te(errorKey(e instanceof ApiError ? e.code : undefined)));
        break;
      }
    }
    setBusy(false);
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api(`/api/coaches/${coachId}/certifications/${id}`, { method: 'DELETE' });
      onChange(items.filter((c) => c.id !== id));
    } catch (e) {
      setError(te(errorKey(e instanceof ApiError ? e.code : undefined)));
    }
  }

  return (
    <View style={styles.list}>
      {items.length < MAX_CERTS && (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={add}
          style={[styles.drop, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.accentText }}>{busy ? t('uploading') : t('chooseFiles')}</Text>
          <Text variant="label">{t('certLimits', { count: items.length, max: MAX_CERTS })}</Text>
        </Pressable>
      )}
      {items.map((c) => (
        <View key={c.id} style={[styles.cert, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={[styles.badge, { backgroundColor: colors.surface2 }]}>
            <Text variant="label" style={styles.badgeText}>
              {badgeOf(c)}
            </Text>
          </View>
          <View style={styles.grow}>
            <Text numberOfLines={1}>{c.title}</Text>
            <Text variant="label">{f.number(c.size / 1024 / 1024, { maximumFractionDigits: 1 })} MB</Text>
          </View>
          <LinkText label={t('remove')} onPress={() => remove(c.id)} muted />
        </View>
      ))}
      {error && <Text style={{ color: colors.warn }}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  grow: { flex: 1 },
  drop: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.card, padding: 20, alignItems: 'center', gap: 6 },
  cert: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radius.card, padding: 12 },
  badge: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 11 },
});
