import { privateDraftOk, type PrivateDraft } from '@el-captain/rules/coach-form';
import { StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { latinDigits } from '@/account/typed-date';
import { useSessionLabels } from '@/sessions/labels';
import { useTheme } from '@/theme/ThemeProvider';
import { Segmented } from '@/ui/Segmented';
import { Tag } from '@/ui/Tag';
import { Text } from '@/ui/Text';
import { TextField } from '@/ui/TextField';

const ltr = { writingDirection: 'ltr', textAlign: 'left' } as const;

/**
 * The web's PrivateSessionSettings: Yes / No, the price and length when Yes, and a line saying whether members can
 * request one. `active` is what's switched on right now.
 */
export function PrivateSettings({ value, onChange, active }: Readonly<{ value: PrivateDraft; onChange: (v: PrivateDraft) => void; active: { price: number; duration: number } | null }>) {
  const t = useTranslations('coachEdit');
  const l = useSessionLabels();
  const { colors } = useTheme();
  const ok = privateDraftOk(value);
  const next = value.on && ok ? { price: Number(value.price), duration: Number(value.duration) } : null;
  let pending: 'privatePendingOff' | 'privatePendingOn' | 'privatePendingChange' | null = null;
  if (active && !value.on) pending = 'privatePendingOff';
  else if (!active && next) pending = 'privatePendingOn';
  else if (active && next && (active.price !== next.price || active.duration !== next.duration)) pending = 'privatePendingChange';

  return (
    <View style={styles.wrap}>
      <View style={styles.group}>
        <Text variant="label">{t('privateOffer')}</Text>
        <Segmented
          label={t('privateOffer')}
          options={[
            { value: 'on', label: t('privateYes') },
            { value: 'off', label: t('privateNo') },
          ]}
          value={value.on ? 'on' : 'off'}
          onChange={(v) => onChange({ ...value, on: v === 'on' })}
        />
      </View>
      <View style={styles.status}>
        <Tag kind={active ? 'accent' : 'past'} label={active ? t('privateOn') : t('privateOff')} />
        <Text muted style={styles.grow}>
          {active ? t('privateOnLine', { price: l.price(active.price), minutes: l.minutes(active.duration) }) : t('privateOffLine')}
        </Text>
      </View>
      {pending && <Text style={{ color: colors.pending }}>{t(pending)}</Text>}
      {value.on && (
        <>
          <View style={styles.row}>
            <View style={styles.grow}>
              <TextField
                label={t('privatePrice')}
                value={value.price}
                placeholder="600"
                keyboardType="number-pad"
                style={ltr}
                invalid={!ok && value.price !== ''}
                onChangeText={(price) => onChange({ ...value, price: latinDigits(price) })}
              />
            </View>
            <View style={styles.grow}>
              <TextField
                label={t('privateDuration')}
                value={value.duration}
                placeholder="60"
                keyboardType="number-pad"
                style={ltr}
                invalid={!ok && value.duration !== ''}
                onChangeText={(duration) => onChange({ ...value, duration: latinDigits(duration) })}
              />
            </View>
          </View>
          <Text variant="label" style={ok ? undefined : { color: colors.warn }}>
            {t('privateRules')}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  group: { gap: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  grow: { flex: 1 },
});
