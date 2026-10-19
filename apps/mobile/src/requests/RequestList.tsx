import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { forget } from '@/api/cache';
import { api, ApiError } from '@/api/client';
import { PATHS } from '@/api/paths';
import type { PrivateRequest, RequestState } from '@/api/types';
import { openPage } from '@/nav/open';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { LinkText } from '@/ui/LinkText';
import { Tag, type TagKind } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';

const TAG_KIND: Record<RequestState, TagKind> = { PENDING: 'pending', ACCEPTED: 'accent', REJECTED: 'warn', CANCELLED: 'warn', EXPIRED: 'past' };
const ACTION_ERRORS = ['request_closed', 'time_conflict', 'network'] as const;

/** The web's RequestList: a member sees whom they asked and can withdraw; a coach sees who asked and can accept or decline. */
export function RequestList({ role, requests, onChange }: { role: 'member' | 'coach'; requests: PrivateRequest[]; onChange: (r: PrivateRequest) => void }) {
  const t = useTranslations('requests');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const l = useSessionLabels();
  const { colors } = useTheme();
  const [busy, setBusy] = useState('');
  const [rejecting, setRejecting] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function run(id: string, action: 'accept' | 'reject' | 'cancel', body: object = {}) {
    setBusy(id);
    setError(null);
    try {
      const r = await api<PrivateRequest>(`/api/private-requests/${id}/${action}`, { method: 'POST', json: body });
      setRejecting('');
      setNote('');
      onChange(r);
      // The kept request lists (and, once accepted, the upcoming sessions) are out of date now: reload them on the next visit.
      forget(PATHS.myRequests);
      forget(PATHS.myUpcoming);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setError(te(ACTION_ERRORS.find((c) => c === code) ?? 'generic'));
    } finally {
      setBusy('');
    }
  }

  if (requests.length === 0) return <Text muted>{t('none')}</Text>;

  return (
    <View style={styles.list}>
      {error && <Text style={{ color: colors.warn }}>{error}</Text>}
      {requests.map((r) => (
        <Card key={r.id} style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.who}>{role === 'coach' ? r.member.name : r.coach.name}</Text>
            {(role === 'member' || r.status !== 'PENDING') && (
              <Tag kind={TAG_KIND[r.status]} label={t(`status.${r.status.toLowerCase() as 'pending'}`)} />
            )}
          </View>
          <Text variant="label">{t('line', { sport: l.sport(r.sport), when: l.when(r.startsAt), place: r.venue.name })}</Text>
          <Text variant="label">{t('terms', { minutes: r.durationMin, price: l.price(r.price) })}</Text>
          {r.message && <Text>{t('message', { message: r.message })}</Text>}
          {r.responseNote && <Text>{t('note', { note: r.responseNote })}</Text>}
          {r.status === 'ACCEPTED' && r.sessionId && (
            <LinkText label={t('viewSession')} onPress={() => openPage(`${role === 'coach' ? '/coach-session' : '/session'}/${r.sessionId}`)} />
          )}
          {r.status === 'PENDING' && role === 'member' && (
            <Button variant="secondary" label={t('withdraw')} busy={busy === r.id} onPress={() => run(r.id, 'cancel')} />
          )}
          {r.status === 'PENDING' && role === 'coach' && rejecting !== r.id && (
            <View style={styles.actions}>
              <View style={styles.grow}>
                <Button label={t('accept')} busy={busy === r.id} onPress={() => run(r.id, 'accept')} />
              </View>
              <View style={styles.grow}>
                <Button variant="secondary" label={t('reject')} onPress={() => setRejecting(r.id)} />
              </View>
            </View>
          )}
          {rejecting === r.id && (
            <View style={styles.reject}>
              <TextField label={t('reject')} value={note} onChangeText={setNote} placeholder={t('notePlaceholder')} multiline />
              <Button variant="danger" label={t('confirmReject')} busy={busy === r.id} onPress={() => run(r.id, 'reject', { note: note.trim() || undefined })} />
              <Button variant="secondary" label={tc('cancel')} onPress={() => setRejecting('')} />
            </View>
          )}
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { gap: 6 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  who: { fontSize: 16, flex: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  grow: { flex: 1 },
  reject: { gap: 10, marginTop: 6 },
});
