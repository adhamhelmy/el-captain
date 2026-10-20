import { endsAt, sessionPhase } from '@el-captain/rules/session-rules';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { load, peek, remember } from '@/api/cache';
import { api, ApiError } from '@/api/client';
import { DETAIL } from '@/api/paths';
import type { Attendee, SessionDetail, Sport, Venue } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { approvedSports, myVenues } from '@/coach/data';
import { SessionForm } from '@/coach/SessionForm';
import { openPage } from '@/nav/open';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { BackLink } from '@/ui/BackLink';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { LinkText } from '@/ui/LinkText';
import { Screen } from '@/ui/Screen';
import { DetailSkeleton } from '@/ui/Skeleton';
import { Sheet } from '@/ui/Sheet';
import { Tag, typeTagKind } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';

/** The web's coach session page: details, who's booked, and (while upcoming) edit and cancel. */
export default function CoachSessionPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTranslations('coachSession');
  const tl = useTranslations('session');
  const tv = useTranslations('venues');
  const te = useTranslations('errors');
  const td = useTranslations('data');
  const tst = useTranslations('status');
  const ts = useTranslations('schedule');
  const l = useSessionLabels();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [s, setS] = useState<SessionDetail | null | undefined>(() => peek<SessionDetail>(DETAIL.session(id)));
  const [roster, setRoster] = useState<Attendee[]>(() => peek<Attendee[]>(DETAIL.attendees(id)) ?? []);
  const [editing, setEditing] = useState(false);
  const [sports, setSports] = useState<Sport[] | null>(null);
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const own = !!s && s.coach.id === user?.id;

  useEffect(() => {
    let stale = false;
    load<SessionDetail>(DETAIL.session(id))
      .then((d) => !stale && setS(d))
      // Offline with this page already showing from the cache: keep it rather than swap in the error.
      .catch(() => !stale && setS((shown) => shown ?? null));
    return () => {
      stale = true;
    };
  }, [id]);

  useEffect(() => {
    if (!own) return;
    load<Attendee[]>(DETAIL.attendees(id))
      .then(setRoster)
      .catch(() => setRoster([]));
  }, [id, own]);

  useEffect(() => {
    if (!editing) return;
    approvedSports().then(setSports);
    myVenues({ active: true }).then(setVenues);
  }, [editing]);

  if (s === null) {
    return (
      <Screen>
        <BackLink label={t('back')} />
        <Text variant="display">{te('generic')}</Text>
      </Screen>
    );
  }
  if (!s)
    return (
      <Screen>
        <DetailSkeleton />
      </Screen>
    );
  const phase = sessionPhase(s);

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      const r = await api<SessionDetail>(`/api/sessions/${id}/cancel`, { method: 'POST', json: { reason } });
      setS({ ...r, bookedByMe: false });
      setRoster([]);
      remember(DETAIL.session(id), { ...r, bookedByMe: false });
      remember(DETAIL.attendees(id), []);
      setCancelling(false);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setError(te(code === 'session_closed' || code === 'network' ? code : 'generic'));
    } finally {
      setBusy(false);
    }
  }

  let levelLabel = s.level ? l.level(s.level) : '—';
  if (s.type === 'PRIVATE') levelLabel = l.oneToOne();
  const info: [string, string, string][] = [
    [t('when'), `${l.day(s.startsAt)} ${l.dayMonth(s.startsAt)}`, t('timeRange', { start: l.time(s.startsAt), end: l.time(endsAt(s.startsAt, s.durationMin)) })],
    [t('where'), s.venue.name, tv('line', { address: s.venue.address, city: s.venue.city })],
    [t('level'), levelLabel, l.minutes(s.durationMin)],
    [t('price'), l.price(s.price), t('paidAtSession')],
  ];
  const fill = s.capacity ? Math.min(s.booked / s.capacity, 1) : 0;

  return (
    <Screen fade>
      <BackLink label={own ? t('backToMine') : t('back')} />
      {s.coverUrl && <Image source={{ uri: s.coverUrl }} style={styles.cover} contentFit="cover" />}

      <View style={styles.tags}>
        <Tag kind={typeTagKind(s.type)} label={td(s.type === 'PRIVATE' ? 'type.private' : 'type.group')} />
        {phase === 'cancelled' ? <Tag kind="warn" label={tst('cancelled')} /> : <Tag kind="past" label={l.sport(s.sport)} />}
      </View>
      <Text variant="display">{l.title(s)}</Text>
      {!own && <Text muted>{s.coach.name}</Text>}
      {phase === 'cancelled' && s.cancelReason && <Text muted>{tl('reason', { reason: s.cancelReason })}</Text>}

      {own && phase === 'upcoming' && !cancelling && (
        <View style={styles.actions}>
          {s.type === 'GROUP' && (
            <View style={styles.grow}>
              <Button label={t('edit')} icon={Pencil} onPress={() => setEditing(true)} />
            </View>
          )}
          <View style={styles.grow}>
            <Button variant="dangerOutline" label={t('cancelSession')} onPress={() => setCancelling(true)} />
          </View>
        </View>
      )}

      {cancelling && (
        <Card style={styles.gap}>
          <Text variant="title">{t('cancelTitle')}</Text>
          <Text muted>{t('cancelHint')}</Text>
          <TextField label={t('reason')} value={reason} onChangeText={setReason} multiline style={styles.text} />
          <Button variant="danger" label={t('confirmCancel')} onPress={cancel} busy={busy} />
          <Button variant="secondary" label={t('keep')} onPress={() => setCancelling(false)} />
        </Card>
      )}
      {error && <Text style={{ color: colors.warn }}>{error}</Text>}

      <View style={[styles.strip, { borderColor: colors.border }]}>
        {info.map(([label, value, sub], i) => (
          <View key={label} style={[styles.cell, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text variant="eyebrow" style={styles.cellLabel}>
              {label}
            </Text>
            <Text style={styles.cellValue}>{value}</Text>
            <Text variant="label">{sub}</Text>
            {i === 1 && s.venue.mapUrl && <LinkText label={tv('map')} onPress={() => Linking.openURL(s.venue.mapUrl!).catch(() => {})} />}
          </View>
        ))}
      </View>

      {s.description && <Text muted>{s.description}</Text>}

      {own ? (
        <View style={styles.gap}>
          <View style={styles.bookedHead}>
            <Text variant="title">{t('bookedOf', { booked: s.booked, capacity: s.capacity })}</Text>
            {s.type === 'GROUP' && phase === 'upcoming' && (
              <Text variant="label" style={{ color: colors.accentText }}>
                {l.spots(s)}
              </Text>
            )}
          </View>
          <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
            <View style={[styles.track, { backgroundColor: colors.accent, width: `${fill * 100}%` }]} />
          </View>
          {roster.length === 0 && <Text muted>{t('noBookings')}</Text>}
          {roster.map((a) => (
            <Pressable
              key={a.bookingId}
              accessibilityRole="link"
              onPress={() => openPage(`/client/${a.memberId}`)}
              style={[styles.attendee, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Avatar name={a.name} size={34} />
              <View style={styles.grow}>
                <Text>{a.name}</Text>
                <Text variant="label">{t('bookedOn', { date: l.dayMonth(a.bookedAt) })}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <Card>
          <Text muted>{t('notYours')}</Text>
        </Card>
      )}

      <Sheet visible={editing} title={ts('editSession')} onClose={() => setEditing(false)}>
        {sports && venues && (
          <SessionForm
            session={s}
            sports={sports}
            venues={venues}
            onCancel={() => setEditing(false)}
            onSaved={([saved]) => {
              setS({ ...saved, bookedByMe: false });
              remember(DETAIL.session(id), { ...saved, bookedByMe: false });
              setEditing(false);
            }}
          />
        )}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1 },
  gap: { gap: 10 },
  cover: { height: 180, borderRadius: radius.card },
  tags: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actions: { flexDirection: 'row', gap: 10 },
  text: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  strip: { borderWidth: 1, borderRadius: radius.card, overflow: 'hidden' },
  cell: { padding: 14, gap: 4 },
  cellLabel: { fontSize: 12 },
  cellValue: { fontSize: 16 },
  bookedHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  track: { height: 6, borderRadius: 3 },
  attendee: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radius.card, padding: 12 },
});
