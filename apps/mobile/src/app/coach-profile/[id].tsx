import { socialHandle, sportName } from '@el-captain/rules/coach-rules';
import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { Link as LinkIcon, MapPin, Play } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { api } from '@/api/client';
import type { Media, PublicCoach, Session } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { filterSports } from '@/coaches/profile';
import { RequestForm } from '@/coaches/RequestForm';
import { useLocale } from '@/i18n/IntlProvider';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { LinkText } from '@/ui/LinkText';
import { Screen } from '@/ui/Screen';
import { Stripes } from '@/ui/Stripes';
import { Text } from '@/ui/Text';

/** Few enough spots left that the row says so in accent (as the web's). */
const LOW_SPOTS = 3;

/** "3:05" from 185 seconds, as the web's clockLength. */
const clockLength = (totalSec: number) => {
  const s = Math.max(0, Math.round(totalSec));
  const [h, m, sec] = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
};

/** A language's name in the reader's language when the device can say it, else its code. */
const languageName = (code: string, locale: string) => {
  try {
    return new Intl.DisplayNames([locale], { type: 'language' }).of(code) ?? code;
  } catch {
    return code.toUpperCase();
  }
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

function SessionRow({ s }: { s: Session }) {
  const t = useTranslations('coachProfile');
  const td = useTranslations('data');
  const l = useSessionLabels();
  const { colors } = useTheme();
  const left = Math.max(s.capacity - s.booked, 0);
  const spotsColor = left === 0 ? colors.warn : left <= LOW_SPOTS ? colors.accentText : colors.text2;
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/session/${s.id}` as Href)}
      style={[styles.sessionRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.date, { backgroundColor: colors.surface2 }]}>
        <Text variant="label">{l.day(s.startsAt)}</Text>
        <Text variant="title" style={styles.dayNum}>
          {l.dayNum(s.startsAt)}
        </Text>
      </View>
      <View style={styles.grow}>
        <Text style={styles.rowTitle}>{l.title(s)}</Text>
        <Text variant="label">
          {[l.sport(s.sport), s.level && l.level(s.level), s.venue.name].filter(Boolean).join(' · ')}
        </Text>
        <Text variant="label">
          {l.time(s.startsAt)} · {l.minutes(s.durationMin)}
        </Text>
        <Text variant="label" style={{ color: spotsColor }}>
          {left <= LOW_SPOTS ? td('spotsLeft', { count: left }) : t('spotsOf', { left, capacity: s.capacity })}
        </Text>
      </View>
      <View style={styles.buy}>
        <Text style={styles.rowTitle}>{l.price(s.price)}</Text>
        <Text variant="label" style={{ color: left === 0 ? colors.text2 : colors.accentText }}>
          {left === 0 ? t('details') : t('book')}
        </Text>
      </View>
    </Pressable>
  );
}

/** The web's CoachProfile for guests and members: who they are, upcoming sessions, media, private sessions, places, links. */
export default function CoachProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTranslations('coachProfile');
  const td = useTranslations('data');
  const to = useTranslations('onboarding');
  const te = useTranslations('errors');
  const { locale } = useLocale();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const l = useSessionLabels();
  const { user, returnTo, setReturnTo } = useAuth();
  const [c, setC] = useState<PublicCoach | null | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sport, setSport] = useState('all');
  const [asking, setAsking] = useState(false);
  const [sent, setSent] = useState(false);
  const [viewing, setViewing] = useState<Media | null>(null);
  const path = `/coach-profile/${id}`;

  useFocusEffect(
    useCallback(() => {
      if (user && returnTo === path) setReturnTo(null);
    }, [user, returnTo, path, setReturnTo]),
  );

  useEffect(() => {
    let stale = false;
    api<PublicCoach>(`/api/coaches/${id}`)
      .then((d) => !stale && setC(d))
      .catch(() => !stale && setC(null));
    api<Session[]>(`/api/sessions?limit=50&coach=${id}`)
      .catch(() => [])
      .then((list) => !stale && setSessions(list));
    return () => {
      stale = true;
    };
  }, [id]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  if (c === null) {
    return (
      <Screen tabs={false}>
        <LinkText label={`← ${t('backToExplore')}`} onPress={back} muted />
        <Text variant="display">{te('generic')}</Text>
      </Screen>
    );
  }
  if (!c) return <Screen tabs={false}>{null}</Screen>;

  const firstName = c.name.trim().split(/\s+/)[0];
  const meta = [
    c.city,
    c.languages.length > 0 && c.languages.map((code) => languageName(code, locale)).join(', '),
    c.age !== null && t('age', { age: c.age }),
    c.gender && td(`gender.${c.gender}`),
  ].filter((m): m is string => !!m);
  const follows = [
    ...(c.instagram ? [{ label: to('instagram'), sub: `@${socialHandle('instagram', c.instagram)}`, url: c.instagram }] : []),
    ...(c.tiktok ? [{ label: to('tiktok'), sub: `@${socialHandle('tiktok', c.tiktok)}`, url: c.tiktok }] : []),
    ...c.links.map((k) => ({ label: k.label, sub: hostOf(k.url), url: k.url })),
  ];
  const takesRequests = c.privatePrice !== null && c.privateDuration !== null && c.venues.length > 0 && c.sports.length > 0;
  const sportsToFilter = filterSports(sessions, c.media);
  const shown = sport === 'all' ? sessions : sessions.filter((s) => s.sport.id === sport);
  const shownMedia = sport === 'all' ? c.media : c.media.filter((m) => m.sport?.id === sport);
  const photos = shownMedia.filter((m) => m.kind === 'PHOTO').length;
  const isMember = user?.role === 'USER';

  // Guests log in first and come back here; members open the form; coaches can't request, so no button.
  const request = () => {
    if (!user) {
      setReturnTo(path);
      router.replace('/guest/sign-in');
    } else setAsking(true);
  };
  const showRequest = !user || isMember;

  return (
    <Screen tabs={false}>
      <LinkText label={`← ${t('backToExplore')}`} onPress={back} muted />
      <View style={[styles.cover, { backgroundColor: colors.surface }]}>
        {c.coverUrl ? <Image source={{ uri: c.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Stripes />}
      </View>
      <View style={styles.head}>
        <View style={[styles.ring, { borderColor: colors.bg, backgroundColor: colors.bg }]}>
          {c.photoUrl ? <Image source={{ uri: c.photoUrl }} style={styles.face} /> : <Avatar name={c.name} size={96} />}
        </View>
        <Text variant="display">{c.name}</Text>
        <Text variant="label">
          {[t('rating', { rating: '0.0' }), t('reviews', { count: 0 }), ...meta].join(' · ')}
        </Text>
      </View>
      {sent && (
        <Pressable onPress={() => setSent(false)} style={[styles.notice, { borderColor: colors.accentText, backgroundColor: colors.accentTint }]}>
          <Text>{t('sent')}</Text>
        </Pressable>
      )}

      {c.sports.length > 0 && (
        <View style={styles.wrap}>
          {c.sports.map((s) => (
            <View key={s.id} style={[styles.pill, { borderColor: colors.border }]}>
              <Text variant="label">{sportName(s, locale)}</Text>
            </View>
          ))}
        </View>
      )}
      {c.bio && <Text muted>{c.bio}</Text>}

      {takesRequests && (
        <Card style={{ backgroundColor: colors.accent, borderColor: colors.accent }}>
          <Text variant="eyebrow" style={{ color: colors.onAccent }}>
            {t('privateSession')}
          </Text>
          <Text variant="display" style={[styles.privatePrice, { color: colors.onAccent }]}>
            {l.price(c.privatePrice!)} <Text style={{ color: colors.onAccent }}>{t('perSession', { minutes: c.privateDuration! })}</Text>
          </Text>
          <Text style={{ color: colors.onAccent }}>
            {t('privateNote', { sports: c.sports.map((s) => sportName(s, locale)).join(' / '), name: firstName })}
          </Text>
          {showRequest && (
            <Pressable onPress={request} accessibilityRole="button" style={[styles.darkButton, { backgroundColor: colors.onAccent }]}>
              <Text style={{ color: colors.accent }}>{user ? t('requestSession') : t('logInShort')}</Text>
            </Pressable>
          )}
        </Card>
      )}

      <Text variant="title">{t('upcoming')}</Text>
      {sportsToFilter.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipRow}>
          <Chip label={`${td('all')} ${sessions.length}`} on={sport === 'all'} onPress={() => setSport('all')} />
          {sportsToFilter.map((s) => (
            <Chip
              key={s.id}
              label={`${sportName(s, locale)} ${sessions.filter((x) => x.sport.id === s.id).length}`}
              on={sport === s.id}
              onPress={() => setSport(s.id)}
            />
          ))}
        </ScrollView>
      )}
      {shown.length > 0 ? (
        shown.map((s) => <SessionRow key={s.id} s={s} />)
      ) : (
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <Text style={styles.center}>{t('noGroup')}</Text>
          {takesRequests && (
            <Text variant="label" style={styles.center}>
              {t('noGroupPrivate', { name: firstName })}
            </Text>
          )}
        </View>
      )}

      {shownMedia.length > 0 && (
        <>
          <View style={styles.mediaHead}>
            <Text variant="title">{t('media')}</Text>
            <Text variant="label">{t('mediaCount', { photos, videos: shownMedia.length - photos })}</Text>
          </View>
          <View style={styles.grid}>
            {shownMedia.map((m) => (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityLabel={t('openMedia', { caption: m.caption ?? t('untitled') })}
                onPress={() => (m.kind === 'VIDEO' ? Linking.openURL(m.url) : setViewing(m))}
                style={[styles.tile, { backgroundColor: colors.surface2 }]}>
                {m.kind === 'PHOTO' ? (
                  <Image source={{ uri: m.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <View style={styles.play}>
                    <Play size={28} color={colors.text} />
                    {m.durationSec !== null && <Text variant="label">{clockLength(m.durationSec)}</Text>}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </>
      )}

      {c.venues.length > 0 && (
        <Card>
          <Text variant="title">{t('trainsAt')}</Text>
          {c.venues.map((v) => (
            <View key={v.id} style={styles.item}>
              <MapPin size={20} color={colors.accentText} />
              <View style={styles.grow}>
                <Text>{v.name}</Text>
                <Text variant="label">{[v.address, v.city].filter(Boolean).join(', ')}</Text>
                {v.mapUrl && <LinkText label={t('map')} onPress={() => Linking.openURL(v.mapUrl!)} />}
              </View>
            </View>
          ))}
        </Card>
      )}
      {follows.length > 0 && (
        <Card>
          <Text variant="title">{t('follow', { name: firstName })}</Text>
          {follows.map((f) => (
            <View key={f.url} style={styles.item}>
              <LinkIcon size={20} color={colors.text2} />
              <View style={styles.grow}>
                <Text>{f.label}</Text>
                <Text variant="label">{f.sub}</Text>
              </View>
              <LinkText label={t('open')} onPress={() => Linking.openURL(f.url)} />
            </View>
          ))}
        </Card>
      )}
      {c.certifications.length > 0 && (
        <Card>
          <Text variant="title">{t('certs')}</Text>
          {c.certifications.map((cert) => (
            <Text key={cert.id}>{cert.title}</Text>
          ))}
        </Card>
      )}

      <Modal visible={asking} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAsking(false)}>
        <ScrollView
          style={{ backgroundColor: colors.bg }}
          contentContainerStyle={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets>
          <View style={styles.sheetHead}>
            <Text variant="title">{t('formTitle')}</Text>
            <LinkText label={t('close')} onPress={() => setAsking(false)} muted />
          </View>
          <RequestForm
            coach={c}
            onSent={() => {
              setAsking(false);
              setSent(true);
            }}
          />
        </ScrollView>
      </Modal>

      <Modal visible={!!viewing} animationType="fade" transparent onRequestClose={() => setViewing(null)}>
        <Pressable style={styles.viewer} onPress={() => setViewing(null)} accessibilityLabel={t('close')}>
          {viewing && <Image source={{ uri: viewing.url }} style={styles.full} contentFit="contain" />}
          {viewing?.caption && <Text style={styles.caption}>{viewing.caption}</Text>}
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { height: 150, borderRadius: radius.card + 4, overflow: 'hidden' },
  head: { marginTop: -60, paddingHorizontal: 4, gap: 6 },
  ring: { width: 104, height: 104, borderRadius: 52, borderWidth: 4, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  face: { width: 96, height: 96, borderRadius: 48 },
  notice: { borderWidth: 1, borderRadius: 12, padding: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 7 },
  privatePrice: { fontSize: 34, lineHeight: 38 },
  darkButton: { minHeight: 48, borderRadius: radius.input, alignItems: 'center', justifyContent: 'center' },
  chipRow: { marginHorizontal: -16, flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: 16 },
  sessionRow: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: radius.row, padding: 12, alignItems: 'center' },
  date: { width: 52, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  dayNum: { fontSize: 26, lineHeight: 28 },
  grow: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15 },
  buy: { alignItems: 'flex-end', gap: 4 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.card, padding: 24, gap: 6 },
  center: { textAlign: 'center' },
  mediaHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: { width: '32%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  play: { alignItems: 'center', gap: 4 },
  item: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  sheet: { padding: 20, gap: 16 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', padding: 16 },
  full: { width: '100%', height: '80%' },
  caption: { color: '#f4f5f0', textAlign: 'center', marginTop: 12 },
});
