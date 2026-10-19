import { fromWallClock, wallClock, weekDates } from '@el-captain/rules/app-time';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { load, peek } from '@/api/cache';
import { PATHS, weekPath } from '@/api/paths';
import type { PrivateRequest, Session, Sport, Venue } from '@/api/types';
import { approvedSports, cachedSports, cachedVenues, myVenues } from '@/coach/data';
import { fillLabel } from '@/coach/session-form';
import { SessionForm } from '@/coach/SessionForm';
import { useLocale } from '@/i18n/IntlProvider';
import { openPage } from '@/nav/open';
import { RequestList } from '@/requests/RequestList';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { Sheet } from '@/ui/Sheet';
import { Bone, FadeIn, Loading, RowSkeleton } from '@/ui/Skeleton';
import { Tag, typeTagKind } from '@/ui/Tag';
import { Text } from '@/ui/Text';

type Tab = 'upcoming' | 'past' | 'requests';
type View_ = 'week' | 'list';

const noon = (date: string) => fromWallClock({ date, time: '12:00' })!;
const list = <T,>(path: string) => load<T[]>(path).catch(() => [] as T[]);
const peekWeek = (week: number) => {
  const path = weekPath(week);
  return (path && peek<Session[]>(path)) || null;
};

/** The web's coach My sessions on a phone: a week agenda or a list of upcoming sessions, past ones, and private requests. */
export default function CoachSessions() {
  const t = useTranslations('schedule');
  const td = useTranslations('data');
  const tst = useTranslations('status');
  const l = useSessionLabels();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const params = useLocalSearchParams<{ tab?: string; add?: string }>();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [view, setView] = useState<View_>('week');
  const [week, setWeek] = useState(0);
  const [adding, setAdding] = useState(false);
  const [reload, setReload] = useState(0);
  const [upcoming, setUpcoming] = useState(() => peek<Session[]>(PATHS.myUpcoming) ?? null);
  const [past, setPast] = useState(() => peek<Session[]>(PATHS.myPast) ?? null);
  const [weekList, setWeekList] = useState(() => peekWeek(0));
  const [requests, setRequests] = useState(() => peek<PrivateRequest[]>(PATHS.myRequests) ?? null);
  const [sports, setSports] = useState<Sport[] | null>(cachedSports);
  const [venues, setVenues] = useState<Venue[] | null>(() => cachedVenues({ active: true }));
  const [notice, setNotice] = useState<string | null>(null);

  // Opened from the dashboard's links (?tab=requests, ?add=1): act on each link once while rendering, then clear it,
  // so the same link works again next time (the tab screen stays mounted).
  const link = params.tab || params.add ? `${params.tab ?? ''}|${params.add ?? ''}` : '';
  const [seenLink, setSeenLink] = useState('');
  if (link !== seenLink) {
    setSeenLink(link);
    if (params.tab === 'requests') setTab('requests');
    if (params.add) setAdding(true);
  }
  useEffect(() => {
    if (link) router.setParams({ tab: undefined, add: undefined });
  }, [link]);

  // Bumped each time the tab comes into view, so the week reloads too after an edit or cancel elsewhere.
  const [focused, setFocused] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let stale = false;
      setFocused((n) => n + 1);
      approvedSports().then((s) => !stale && setSports(s));
      myVenues({ active: true }).then((v) => !stale && setVenues(v));
      list<Session>(PATHS.myUpcoming).then((r) => !stale && setUpcoming(r));
      list<Session>(PATHS.myPast).then((r) => !stale && setPast(r));
      list<PrivateRequest>(PATHS.myRequests).then((r) => !stale && setRequests(r));
      return () => {
        stale = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- reload re-runs it after publishing or accepting
    }, [reload]),
  );

  const days = weekDates(week);
  const weekKey = days[0];
  // The shown week loads by date range, so it's complete however many sessions come before it.
  useEffect(() => {
    let stale = false;
    const path = weekPath(week);
    if (!path) return;
    list<Session>(path).then((r) => !stale && setWeekList(r));
    return () => {
      stale = true;
    };
  }, [week, reload, focused]);

  const pending = requests?.filter((r) => r.status === 'PENDING').length ?? 0;
  const showWeek = tab === 'upcoming' && view === 'week';
  const shown = tab === 'past' ? past : upcoming;
  const today = wallClock(new Date()).date;
  const inWeek = (weekList ?? []).filter((s) => s.status === 'SCHEDULED' && days.includes(wallClock(new Date(s.startsAt)).date));
  const [first, last] = [noon(days[0]), noon(days[6])];
  const sameMonth = days[0].slice(0, 7) === days[6].slice(0, 7);
  const range = t('weekRange', {
    start: `${l.day(first)} ${sameMonth ? String(Number(days[0].slice(8))) : l.dayMonth(first)}`,
    end: `${l.day(last)} ${l.dayMonth(last)}`,
  });
  const count = t('weekCount', { count: inWeek.length });
  const open = (s: Session) => openPage(`/coach-session/${s.id}`);
  // The new week's sessions load by date range; show what we had for it, else placeholders, never an empty week.
  const goWeek = (next: number) => {
    setWeekList(peekWeek(next));
    setWeek(next);
  };
  const skeleton = (lead: 'none' | 'date') => (
    <Loading style={styles.cards}>
      <RowSkeleton lead={lead} />
      <RowSkeleton lead={lead} />
      <RowSkeleton lead={lead} />
    </Loading>
  );
  const fillColor = (s: Session) => (s.type !== 'PRIVATE' && s.booked >= s.capacity ? colors.warn : colors.text);

  return (
    <Screen>
      <Text variant="display">{t('title')}</Text>
      <Button label={t('add')} onPress={() => setAdding(true)} />
      {notice && (
        <Pressable onPress={() => setNotice(null)} accessibilityRole="alert" style={[styles.notice, { borderColor: colors.accentText, backgroundColor: colors.accentTint }]}>
          <Text>{notice}</Text>
        </Pressable>
      )}

      <Segmented
        label={t('title')}
        options={(['upcoming', 'past', 'requests'] as const).map((k) => ({ value: k, label: k === 'requests' && pending > 0 ? `${t(k)} · ${pending}` : t(k) }))}
        value={tab}
        onChange={setTab}
      />
      {tab === 'upcoming' && (
        <Segmented
          label={t('week')}
          options={[
            { value: 'week', label: t('week') },
            { value: 'list', label: t('list') },
          ]}
          value={view}
          onChange={setView}
        />
      )}

      {tab === 'requests' && !requests && skeleton('none')}
      {tab === 'requests' && requests && (
        <FadeIn>
          <RequestList
            role="coach"
            requests={requests}
            onChange={(r) => {
              setRequests(requests.map((x) => (x.id === r.id ? r : x)));
              // Accepting puts a private session on the calendar.
              if (r.status === 'ACCEPTED') setReload((n) => n + 1);
            }}
          />
        </FadeIn>
      )}

      {showWeek && (
        <>
          <View style={styles.weekNav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('prevWeek')}
              disabled={week === 0}
              onPress={() => goWeek(week - 1)}
              style={[styles.arrow, { borderColor: colors.border, opacity: week === 0 ? 0.4 : 1 }]}>
              <Text style={styles.arrowText}>{isRTL ? '›' : '‹'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('nextWeek')}
              onPress={() => goWeek(week + 1)}
              style={[styles.arrow, { borderColor: colors.border }]}>
              <Text style={styles.arrowText}>{isRTL ? '‹' : '›'}</Text>
            </Pressable>
            <View style={styles.grow}>
              <Text style={styles.range}>{range}</Text>
              {weekList ? <Text variant="label">{week === 0 ? t('thisWeek', { count }) : count}</Text> : <Bone width={120} height={12} />}
            </View>
          </View>
          {!weekList && skeleton('date')}
          {weekList && (
            <FadeIn key={weekKey}>
              {days.map((day) => {
                  const items = inWeek.filter((s) => wallClock(new Date(s.startsAt)).date === day);
                  if (!items.length) return null;
                  const at = noon(day);
                  return (
                    <View key={day} style={styles.day}>
                      <View style={styles.dayHead}>
                        <Text variant="label" style={day === today ? { color: colors.accentText } : undefined}>
                          {l.day(at)}
                        </Text>
                        <Text style={[styles.dayNum, day < today && { color: colors.text3 }, day === today && { color: colors.accentText }]}>{l.dayNum(at)}</Text>
                      </View>
                      {items.map((s) => (
                        <Pressable
                          key={s.id}
                          accessibilityRole="link"
                          onPress={() => open(s)}
                          style={[
                            styles.agendaRow,
                            { backgroundColor: s.type === 'PRIVATE' ? colors.warnTint : colors.accentTint, borderStartColor: s.type === 'PRIVATE' ? colors.warn : colors.accentText },
                          ]}>
                          <Text variant="label">{l.time(s.startsAt)}</Text>
                          <Text numberOfLines={1} style={styles.agendaTitle}>
                            {l.title(s)}
                          </Text>
                          <Text variant="label" style={{ color: colors.text }}>
                            {s.type === 'PRIVATE' ? l.oneToOne() : l.fill(s)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  );
                })}
            </FadeIn>
          )}
          {weekList && inWeek.length === 0 && (
            <Text variant="label" style={styles.center}>
              {t.rich('emptyWeek', {
                add: (chunks) => (
                  <Text variant="label" style={{ color: colors.accentText }} onPress={() => setAdding(true)}>
                    {chunks}
                  </Text>
                ),
              })}
            </Text>
          )}
        </>
      )}

      {tab !== 'requests' && !showWeek && !shown && skeleton('none')}
      {tab !== 'requests' && !showWeek && shown && (
        <FadeIn key={tab} style={styles.cards}>
          {shown.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="link"
              onPress={() => open(s)}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <View style={styles.grow}>
                  <Text numberOfLines={1} style={styles.cardTitle}>
                    {l.title(s)}
                  </Text>
                  <Text variant="label" numberOfLines={1}>
                    {s.venue.name}
                  </Text>
                </View>
                <Text variant="label" style={{ color: fillColor(s) }}>
                  {fillLabel(s, l, t('full'))}
                </Text>
              </View>
              <View style={styles.cardBottom}>
                <Text variant="label">{l.when(s.startsAt)}</Text>
                {s.status === 'CANCELLED' ? <Tag kind="warn" label={tst('cancelled')} /> : <Tag kind={typeTagKind(s.type)} label={td(s.type === 'PRIVATE' ? 'type.private' : 'type.group')} />}
                <Text variant="label" style={[styles.price, { color: colors.text }]}>
                  {l.price(s.price)}
                </Text>
              </View>
            </Pressable>
          ))}
          {shown.length === 0 && <Text muted>{t('empty')}</Text>}
        </FadeIn>
      )}

      <Sheet visible={adding} title={t('newSession')} onClose={() => setAdding(false)}>
        {sports && venues && (
          <SessionForm
            sports={sports}
            venues={venues}
            onCancel={() => setAdding(false)}
            onVenueAdded={(v) => setVenues((all) => [...(all ?? []), v])}
            onSaved={(saved) => {
              setAdding(false);
              setNotice(t('published', { count: saved.length }));
              setTab('upcoming');
              setReload((n) => n + 1);
            }}
          />
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  center: { textAlign: 'center', marginTop: 8 },
  notice: { borderWidth: 1, borderRadius: radius.card, padding: 14 },
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 20, lineHeight: 22 },
  range: { fontSize: 15 },
  day: { gap: 8 },
  dayHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  dayNum: { fontSize: 18 },
  agendaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderStartWidth: 3 },
  agendaTitle: { flex: 1, fontSize: 14 },
  cards: { gap: 10 },
  card: { borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cardTitle: { fontSize: 15 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  price: { marginStart: 'auto' },
});
