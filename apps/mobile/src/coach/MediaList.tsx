import { MAX_MEDIA, MEDIA_CAPTION_MAX, mediaKindOf, sportName } from '@el-captain/rules/coach-rules';
import { clockLength } from '@el-captain/rules/media';
import { Image } from 'expo-image';
import { Video } from 'lucide-react-native';
import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { api, ApiError } from '@/api/client';
import type { Media, Sport } from '@/api/types';
import { useLocale } from '@/i18n/IntlProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Chip } from '@/ui/Chip';
import { LinkText } from '@/ui/LinkText';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';
import { pickMedia } from '@/uploads/pick';
import { uploadFile } from '@/uploads/upload';

const KNOWN_ERRORS = ['invalid_upload', 'invalid_profile', 'profile_locked', 'network'] as const;
const errorKey = (code?: string) => KNOWN_ERRORS.find((c) => c === code) ?? 'generic';

/**
 * The web's MediaList: photos and videos for the public profile. Uploads, captions, sports and removals save right
 * away, so they stay out of the profile's save bar. `sports` are the coach's saved sports.
 */
export function MediaList({ coachId, items, sports, onChange }: { coachId: string; items: Media[]; sports: Sport[]; onChange: Dispatch<SetStateAction<Media[]>> }) {
  const t = useTranslations('coachEdit');
  const to = useTranslations('onboarding');
  const te = useTranslations('errors');
  const { locale } = useLocale();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  // The sport just tapped, shown at once while its save runs; dropped when the save lands or fails.
  const [sportPick, setSportPick] = useState<Record<string, string>>({});
  const dropPick = (id: string) => setSportPick(({ [id]: _, ...rest }) => rest);
  const wanted = useRef(new Map<string, { caption: string; sportId: string }>());
  const queue = useRef(new Map<string, Promise<void>>());

  /** Uploads one file after another, so the grid grows in the order they were picked. */
  async function add() {
    const files = await pickMedia(MAX_MEDIA - items.length);
    if (!files.length) return;
    setBusy(true);
    setError(null);
    for (const file of files.slice(0, MAX_MEDIA - items.length)) {
      const kind = mediaKindOf(file.type);
      if (!kind) {
        setError(te('invalid_upload'));
        break;
      }
      const up = await uploadFile(kind, coachId, file);
      if (!up.ok) {
        setError(te(up.code));
        break;
      }
      try {
        const saved = await api<Media>(`/api/coaches/${coachId}/media`, {
          method: 'POST',
          json: { filePath: up.path, caption: '', sportId: sports.length === 1 ? sports[0].id : '', durationSec: file.durationSec },
        });
        onChange((list) => [...list, saved]);
      } catch (e) {
        setError(te(errorKey(e instanceof ApiError ? e.code : undefined)));
        break;
      }
    }
    setBusy(false);
  }

  /**
   * Saves the caption and sport together. Each item keeps the latest wanted values and its saves run one after another,
   * so a quick caption edit followed by a sport change can't undo each other.
   */
  function save(m: Media, patch: { caption?: string; sportId?: string }) {
    const before = wanted.current.get(m.id) ?? { caption: m.caption ?? '', sportId: m.sport?.id ?? '' };
    const next = { ...before, ...patch };
    if (next.caption.trim() === before.caption.trim() && next.sportId === before.sportId) return;
    wanted.current.set(m.id, next);
    if (patch.sportId !== undefined) setSportPick((p) => ({ ...p, [m.id]: next.sportId }));
    setError(null);
    const run = (queue.current.get(m.id) ?? Promise.resolve()).then(async () => {
      try {
        const saved = await api<Media>(`/api/coaches/${coachId}/media/${m.id}`, { method: 'PATCH', json: next });
        onChange((list) => list.map((x) => (x.id === m.id ? saved : x)));
        dropPick(m.id);
        setCaptions(({ [m.id]: draft, ...rest }) => (draft === undefined || draft === next.caption ? rest : { ...rest, [m.id]: draft }));
      } catch (e) {
        // Forget what was wanted, so the same caption or sport can be saved again, and show the saved sport again.
        wanted.current.delete(m.id);
        dropPick(m.id);
        setError(te(errorKey(e instanceof ApiError ? e.code : undefined)));
      }
    });
    queue.current.set(m.id, run);
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api(`/api/coaches/${coachId}/media/${id}`, { method: 'DELETE' });
      onChange((list) => list.filter((m) => m.id !== id));
    } catch (e) {
      setError(te(errorKey(e instanceof ApiError ? e.code : undefined)));
    }
  }

  return (
    <View style={styles.list}>
      <Text muted>{t('mediaHint')}</Text>
      {items.length < MAX_MEDIA && (
        <Pressable accessibilityRole="button" disabled={busy} onPress={add} style={[styles.drop, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.accentText }}>{busy ? to('uploading') : t('mediaChoose')}</Text>
          <Text variant="label">{t('mediaLimits', { count: items.length, max: MAX_MEDIA })}</Text>
        </Pressable>
      )}
      {items.map((m) => {
        const sportId = sportPick[m.id] ?? m.sport?.id ?? '';
        return (
          <View key={m.id} style={[styles.item, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={[styles.preview, { backgroundColor: colors.surface2 }]}>
              {m.kind === 'VIDEO' ? (
                <View style={styles.video}>
                  <Video size={28} color={colors.text2} />
                  <Text variant="label">{m.durationSec !== null ? clockLength(m.durationSec) : t('video')}</Text>
                </View>
              ) : (
                <Image source={{ uri: m.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              )}
            </View>
            <View style={styles.body}>
              <TextField
                label={t('caption')}
                placeholder={t('captionPlaceholder')}
                maxLength={MEDIA_CAPTION_MAX}
                value={captions[m.id] ?? m.caption ?? ''}
                onChangeText={(v) => setCaptions((c) => ({ ...c, [m.id]: v }))}
                onBlur={() => captions[m.id] !== undefined && save(m, { caption: captions[m.id] })}
              />
              <View style={styles.chips}>
                <Chip label={t('noSport')} on={sportId === ''} onPress={() => save(m, { sportId: '' })} />
                {sports.map((s) => (
                  <Chip key={s.id} label={sportName(s, locale)} on={sportId === s.id} onPress={() => save(m, { sportId: s.id })} />
                ))}
              </View>
              <LinkText label={to('remove')} onPress={() => remove(m.id)} muted />
            </View>
          </View>
        );
      })}
      {error && <Text style={{ color: colors.warn }}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  drop: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.card, padding: 20, alignItems: 'center', gap: 6 },
  item: { borderWidth: 1, borderRadius: radius.card, overflow: 'hidden' },
  preview: { height: 180, alignItems: 'center', justifyContent: 'center' },
  video: { alignItems: 'center', gap: 6 },
  body: { padding: 12, gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
