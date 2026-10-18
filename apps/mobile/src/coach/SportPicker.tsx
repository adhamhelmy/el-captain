import { MAX_SPORTS, sportKey, sportName } from '@el-captain/rules/coach-rules';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { api, ApiError } from '@/api/client';
import type { Sport } from '@/api/types';
import { useLocale } from '@/i18n/IntlProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { Chip } from '@/ui/Chip';
import { LinkText } from '@/ui/LinkText';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';

const SHOWN = 16;

/** The web's SportPicker: search and pick sports; offers to add one that isn't listed, and catches duplicates. */
export function SportPicker({ selected, onChange, onBusy }: { selected: Sport[]; onChange: (s: Sport[]) => void; onBusy?: (busy: boolean) => void }) {
  const t = useTranslations('onboarding');
  const te = useTranslations('errors');
  const { locale } = useLocale();
  const { colors } = useTheme();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Sport[]>([]);
  const [suggest, setSuggest] = useState<Sport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    const timer = setTimeout(() => {
      api<Sport[]>(`/api/sports?q=${encodeURIComponent(q.trim())}`)
        .then((r) => !stale && setResults(r))
        .catch(() => {});
    }, 200);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [q]);

  const chosen = new Set(selected.map((s) => s.id));
  const full = selected.length >= MAX_SPORTS;
  const typed = q.trim();
  const exact = [...results, ...selected].some((s) => sportKey(s.nameEn) === sportKey(typed) || (s.nameAr && sportKey(s.nameAr) === sportKey(typed)));
  const options = results.filter((s) => !chosen.has(s.id)).slice(0, SHOWN);

  function pick(s: Sport) {
    if (!chosen.has(s.id) && !full) onChange([...selected, s]);
    setQ('');
    setSuggest(null);
  }

  async function add() {
    setError(null);
    onBusy?.(true);
    try {
      pick(await api<Sport>('/api/sports', { method: 'POST', json: { name: typed } }));
    } catch (e) {
      const ae = e instanceof ApiError ? e : null;
      if (ae?.code === 'sport_exists' && ae.body.sport) return setSuggest(ae.body.sport as Sport);
      setError(te(ae?.code === 'invalid_profile' || ae?.code === 'network' ? ae.code : 'generic'));
    } finally {
      onBusy?.(false);
    }
  }

  return (
    <View style={styles.picker}>
      <TextField
        label={t('sportSearch')}
        placeholder={t('sportSearch')}
        value={q}
        editable={!full}
        onChangeText={(v) => {
          setQ(v);
          setSuggest(null);
        }}
      />
      <View style={styles.group}>
        <View style={styles.labelRow}>
          <Text variant="label">{t('yourSports')}</Text>
          <Text variant="label">
            {selected.length} / {MAX_SPORTS}
          </Text>
        </View>
        <View style={styles.wrap}>
          {selected.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityLabel={t('removeSport', { name: sportName(s, locale) })}
              onPress={() => onChange(selected.filter((x) => x.id !== s.id))}
              style={[
                styles.on,
                s.status === 'PENDING'
                  ? { borderColor: colors.pending, backgroundColor: colors.pendingTint }
                  : { borderColor: colors.accentText, backgroundColor: colors.accentTag },
              ]}>
              <Text variant="label" style={{ color: s.status === 'PENDING' ? colors.pending : colors.accentText }}>
                {sportName(s, locale)}
              </Text>
              <X size={14} color={s.status === 'PENDING' ? colors.pending : colors.accentText} />
            </Pressable>
          ))}
          {selected.length === 0 && <Text muted>{t('noSportsYet')}</Text>}
        </View>
        {selected.some((s) => s.status === 'PENDING') && <Text variant="label">{t('newSport')}</Text>}
      </View>
      {suggest && (
        <View style={styles.labelRow}>
          <Text style={styles.grow}>{t('didYouMean', { name: sportName(suggest, locale) })}</Text>
          <LinkText label={t('useIt')} onPress={() => pick(suggest)} />
        </View>
      )}
      {!full && (
        <View style={styles.group}>
          <Text variant="label">{typed ? t('sportMatches') : t('sportsOnApp')}</Text>
          <View style={styles.wrap}>
            {typed.length >= 2 && !exact && !suggest && <Chip label={t('addSport', { name: typed })} on onPress={add} />}
            {options.map((s) => (
              <Chip key={s.id} label={sportName(s, locale)} on={false} onPress={() => pick(s)} />
            ))}
          </View>
          <Text variant="label">{t('newSportNote')}</Text>
        </View>
      )}
      {error && <Text style={{ color: colors.warn }}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  picker: { gap: 16 },
  group: { gap: 8 },
  grow: { flex: 1 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  on: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 100, paddingHorizontal: 14, minHeight: 36 },
});
