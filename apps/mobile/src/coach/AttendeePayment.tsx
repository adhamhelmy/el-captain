import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { api } from '@/api/client';
import type { Attendee } from '@/api/types';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from '@/ui/Text';

type Marked = 'PAID' | 'FAILED';

/**
 * How a booked member pays (the web's AttendeePayment). Cash is the coach's to mark once the session starts: paid, or not paid
 * (members with unpaid cash sessions can't choose cash again).
 */
export function AttendeePayment({ a, started, onMarked }: Readonly<{ a: Attendee; started: boolean; onMarked: (status: Marked) => void }>) {
  const t = useTranslations('coachSession');
  const ts = useTranslations('session');
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const p = a.payment;
  if (!p) return null;
  if (p.method !== 'cash') return <Text variant="label">{ts(`method.${p.method}`)}</Text>;
  if (!started) return <Text variant="label">{t('cashAtSession')}</Text>;

  const mark = async (paid: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await api<{ status: Marked }>(`/api/payments/${p.id}/cash`, { method: 'POST', json: { paid } });
      onMarked(r.status);
    } catch {
      // Left as it was; the coach can tap again.
    } finally {
      setBusy(false);
    }
  };
  const option = (paid: boolean) => {
    const on = p.status === (paid ? 'PAID' : 'FAILED');
    const fill = paid ? { backgroundColor: colors.accent } : { backgroundColor: colors.warnTint };
    const ink = paid ? colors.onAccent : colors.warn;
    return (
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: on, disabled: busy }}
        onPress={() => mark(paid)}
        style={[styles.option, on && fill, !paid && { borderStartWidth: 1, borderColor: colors.border }]}>
        <Text variant="label" style={{ color: on ? ink : colors.text2 }}>
          {t(paid ? 'cashPaid' : 'cashUnpaid')}
        </Text>
      </Pressable>
    );
  };
  return (
    <View accessibilityRole="radiogroup" style={[styles.cash, { borderColor: colors.border }]}>
      {option(true)}
      {option(false)}
    </View>
  );
}

const styles = StyleSheet.create({
  cash: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  option: { paddingHorizontal: 10, paddingVertical: 6 },
});
