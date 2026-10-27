import { sportName } from '@el-captain/rules/coach-rules';
import { Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { load, peek, prefetch } from '@/api/cache';
import { PATHS } from '@/api/paths';
import type { PublicCoach, Session, Sport } from '@/api/types';
import { useLocale } from '@/i18n/IntlProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, uiFont } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Screen } from '@/ui/Screen';
import { Bone, CardSkeleton, FadeIn, Loading } from '@/ui/Skeleton';
import { Text } from '@/ui/Text';
import { CoachCard } from './CoachCard';
import { exploreQuery, sportHits } from './search';
import { SessionCard } from './SessionCard';

/** How long typing must pause before the search is sent, and coaches shown before "Show all" (as on the web). */
const SEARCH_DELAY_MS = 300;
const COACHES_SHOWN = 4;
const paths = (query: string) => [`/api/coaches?${query}`, `/api/sessions?${query}`] as const;

function Empty({ text }: Readonly<{ text: string }>) {
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
  const [sports, setSports] = useState(() => peek<Sport[]>(PATHS.sports) ?? null);
  const [coaches, setCoaches] = useState(() => peek<PublicCoach[]>(PATHS.exploreCoaches) ?? null);
  const [sessions, setSessions] = useState(() => peek<Session[]>(PATHS.exploreSessions) ?? null);
  const [allCoaches, setAllCoaches] = useState(false);

  useEffect(() => {
    load<Sport[]>(PATHS.sports)
      .then((list) => {
        setSports(list);
        // Each sport's results load in the background, so tapping its chip shows them at once.
        prefetch(list.flatMap((s) => paths(exploreQuery({ sport: s.id, q: '' }))));
      })
      .catch(() => setSports([]));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setNeedle(q.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    // A slow answer to an older search must not replace a newer one.
    let stale = false;
    const [coachPath, sessionPath] = paths(exploreQuery({ sport, q: needle }));
    load<PublicCoach[]>(coachPath)
      .catch(() => [])
      .then((list) => {
        if (stale) return;
        setCoaches(list);
        setAllCoaches(false);
      });
    load<Session[]>(sessionPath)
      .catch(() => [])
      .then((list) => !stale && setSessions(list));
    return () => {
      stale = true;
    };
  }, [sport, needle]);

  // A new sport shows its results at once: what was loaded for it before, else placeholders, never the old sport's list.
  const chooseSport = (id: string, query = needle) => {
    const [coachPath, sessionPath] = paths(exploreQuery({ sport: id, q: query }));
    setSport(id);
    setCoaches(peek<PublicCoach[]>(coachPath) ?? null);
    setSessions(peek<Session[]>(sessionPath) ?? null);
    setAllCoaches(false);
  };
  const pickSport = (id: string) => {
    setQ('');
    setNeedle('');
    chooseSport(id, '');
  };
  const hits = sportHits(sports ?? [], needle, sport);
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
        <Chip label={td('all')} on={sport === 'all'} onPress={() => chooseSport('all')} />
        {sports === null && [72, 96, 64, 88].map((w) => <Bone key={w} width={w} height={36} round={radius.pill} />)}
        {sports?.map((s) => (
          <Chip key={s.id} label={sportName(s, locale)} on={sport === s.id} onPress={() => chooseSport(s.id)} />
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

      {coaches === null && (
        <View style={styles.section}>
          <Text variant="title">{t('coaches')}</Text>
          <Loading style={styles.list}>
            <CardSkeleton avatar />
            <CardSkeleton avatar />
          </Loading>
        </View>
      )}
      {coaches && (coaches.length > 0 || filtered) && (
        <View style={styles.section}>
          <Text variant="title">{t('coaches')}</Text>
          <FadeIn style={styles.list}>
            {shownCoaches?.map((c) => (
              <CoachCard key={c.id} c={c} />
            ))}
          </FadeIn>
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
        {sessions === null ? (
          <Loading style={styles.list}>
            <CardSkeleton />
            <CardSkeleton />
          </Loading>
        ) : (
          <FadeIn style={styles.list}>
            {sessions.map((s) => (
              <SessionCard key={s.id} s={s} />
            ))}
            {sessions.length === 0 && <Empty text={t('noSessions')} />}
          </FadeIn>
        )}
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
  list: { gap: 12 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.card, padding: 24 },
  center: { textAlign: 'center' },
});
