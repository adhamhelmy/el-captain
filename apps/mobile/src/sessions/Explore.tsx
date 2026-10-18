import { sportName } from '@el-captain/rules/coach-rules';
import { Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { api } from '@/api/client';
import type { PublicCoach, Session, Sport } from '@/api/types';
import { useLocale } from '@/i18n/IntlProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, uiFont } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { CoachCard } from './CoachCard';
import { exploreQuery, sportHits } from './search';
import { SessionCard } from './SessionCard';

/** How long typing must pause before the search is sent, and coaches shown before "Show all" (as on the web). */
const SEARCH_DELAY_MS = 300;
const COACHES_SHOWN = 4;

function Empty({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.empty, { borderColor: colors.border }]}>
      <Text variant="label" style={styles.center}>
        {text}
      </Text>
    </View>
  );
}

/** The web's Explore: one search over sessions, sports and coaches; picking a sport narrows both lists. */
export function Explore() {
  const t = useTranslations('explore');
  const td = useTranslations('data');
  const { colors } = useTheme();
  const { locale, isRTL } = useLocale();
  const [q, setQ] = useState('');
  const [needle, setNeedle] = useState('');
  const [sport, setSport] = useState('all');
  const [sports, setSports] = useState<Sport[]>([]);
  const [coaches, setCoaches] = useState<PublicCoach[] | null>(null);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [allCoaches, setAllCoaches] = useState(false);

  useEffect(() => {
    api<Sport[]>('/api/sports')
      .then(setSports)
      .catch(() => setSports([]));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setNeedle(q.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    // A slow answer to an older search must not replace a newer one.
    let stale = false;
    const query = exploreQuery({ sport, q: needle });
    api<PublicCoach[]>(`/api/coaches?${query}`)
      .catch(() => [])
      .then((list) => {
        if (stale) return;
        setCoaches(list);
        setAllCoaches(false);
      });
    api<Session[]>(`/api/sessions?${query}`)
      .catch(() => [])
      .then((list) => !stale && setSessions(list));
    return () => {
      stale = true;
    };
  }, [sport, needle]);

  const pickSport = (id: string) => {
    setSport(id);
    setQ('');
    setNeedle('');
  };
  const hits = sportHits(sports, needle, sport);
  const filtered = needle !== '' || sport !== 'all';
  const shownCoaches = allCoaches ? coaches : coaches?.slice(0, COACHES_SHOWN);

  return (
    <Screen>
      <View style={styles.head}>
        <Text variant="display">{t('title')}</Text>
        <Text muted>{t('sub')}</Text>
      </View>
      <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={18} color={colors.text3} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('search')}
          placeholderTextColor={colors.text3}
          accessibilityLabel={t('search')}
          returnKeyType="search"
          autoCorrect={false}
          style={[styles.searchInput, { color: colors.text, fontFamily: uiFont(isRTL) }]}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipRow}>
        <Chip label={td('all')} on={sport === 'all'} onPress={() => setSport('all')} />
        {sports.map((s) => (
          <Chip key={s.id} label={sportName(s, locale)} on={sport === s.id} onPress={() => setSport(s.id)} />
        ))}
      </ScrollView>

      {hits.length > 0 && (
        <View style={styles.section}>
          <Text variant="title">{t('sports')}</Text>
          <View style={styles.wrap}>
            {hits.map((s) => (
              <Chip key={s.id} label={sportName(s, locale)} on={false} onPress={() => pickSport(s.id)} />
            ))}
          </View>
        </View>
      )}

      {coaches && (coaches.length > 0 || filtered) && (
        <View style={styles.section}>
          <Text variant="title">{t('coaches')}</Text>
          {shownCoaches?.map((c) => (
            <CoachCard key={c.id} c={c} />
          ))}
          {coaches.length === 0 && <Empty text={t('noCoaches')} />}
          {coaches.length > COACHES_SHOWN && (
            <Button
              variant="secondary"
              label={allCoaches ? t('showLess') : t('showAll', { count: coaches.length })}
              onPress={() => setAllCoaches(!allCoaches)}
            />
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text variant="title">{t('sessions')}</Text>
        {sessions?.map((s) => (
          <SessionCard key={s.id} s={s} />
        ))}
        {sessions?.length === 0 && <Empty text={t('noSessions')} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 6 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: radius.input, paddingHorizontal: 14, minHeight: 46 },
  searchInput: { flex: 1, fontSize: 15, minHeight: 44, fontFamily: fonts.uiRegular },
  chipRow: { marginHorizontal: -16, flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { gap: 12, marginTop: 8 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.card, padding: 24 },
  center: { textAlign: 'center' },
});
