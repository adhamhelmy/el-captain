import { VENUE, venueProblems, type VenueField } from '@el-captain/rules/session-rules';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { api, ApiError } from '@/api/client';
import type { Venue } from '@/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';

export type VenueSaved = { venue: Venue; action: 'added' | 'saved' | 'archived' };

const ltr = { writingDirection: 'ltr', textAlign: 'left' } as const;

/** The web's VenueDrawer body: add or edit one location; it saves straight away and hands the result back. */
export function VenueForm({ venue, onSaved, onCancel }: { venue?: Venue; onSaved: (r: VenueSaved) => void; onCancel: () => void }) {
  const t = useTranslations('venues');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const { colors } = useTheme();
  const [draft, setDraft] = useState({ name: venue?.name ?? '', address: venue?.address ?? '', city: venue?.city ?? '', mapUrl: venue?.mapUrl ?? '' });
  const [bad, setBad] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const problem = t('problem', { nameMax: VENUE.name, addressMax: VENUE.address, cityMax: VENUE.city });

  const edit = (f: VenueField, value: string) => {
    setDraft({ ...draft, [f]: value });
    setBad(bad.filter((b) => b !== f));
  };

  async function save() {
    const problems = venueProblems(draft);
    setBad(problems);
    if (problems.length) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      const saved = await api<Venue>(venue ? `/api/venues/${venue.id}` : '/api/venues/me', { method: venue ? 'PATCH' : 'POST', json: draft });
      onSaved({ venue: saved, action: venue ? 'saved' : 'added' });
    } catch (e) {
      const ae = e instanceof ApiError ? e : null;
      setBad(ae?.fields ?? []);
      setError(ae?.code === 'invalid_venue' ? problem : te(ae?.code === 'network' ? 'network' : 'generic'));
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!venue) return;
    setBusy(true);
    setError(null);
    try {
      onSaved({ venue: await api<Venue>(`/api/venues/${venue.id}`, { method: 'DELETE' }), action: 'archived' });
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined;
      setError(te(code === 'last_venue' || code === 'network' ? code : 'generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.form}>
      <TextField label={t('name')} value={draft.name} onChangeText={(v) => edit('name', v)} placeholder={t('namePlaceholder')} invalid={bad.includes('name')} />
      <TextField label={t('address')} value={draft.address} onChangeText={(v) => edit('address', v)} placeholder={t('addressPlaceholder')} invalid={bad.includes('address')} />
      <TextField label={t('city')} value={draft.city} onChangeText={(v) => edit('city', v)} invalid={bad.includes('city')} />
      <TextField
        label={t('mapUrl')}
        value={draft.mapUrl}
        onChangeText={(v) => edit('mapUrl', v)}
        placeholder="https://maps.app.goo.gl/…"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={ltr}
        invalid={bad.includes('mapUrl')}
        hint={t('mapHint')}
      />
      {error && <Text style={{ color: colors.warn }}>{error}</Text>}
      <Button label={venue ? t('save') : t('create')} onPress={save} busy={busy} />
      <Button variant="secondary" label={tc('cancel')} onPress={onCancel} />
      {venue && !venue.archived && <Button variant="danger" label={t('archive')} onPress={archive} busy={busy} />}
    </View>
  );
}

const styles = StyleSheet.create({ form: { gap: 14 } });
