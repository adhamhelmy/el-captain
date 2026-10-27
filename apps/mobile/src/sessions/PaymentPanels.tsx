import type { PaymentMethod } from '@el-captain/rules/payment-rules';
import { StyleSheet, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { Segmented } from '@/ui/Segmented';
import { Text } from '@/ui/Text';

/** Card or cash, when the session offers both (the web's MethodPicker). */
export function MethodPicker({ methods, value, onChange }: Readonly<{ methods: PaymentMethod[]; value: PaymentMethod; onChange: (m: PaymentMethod) => void }>) {
  const t = useTranslations('session');
  if (methods.length < 2) return null;
  return (
    <View style={styles.methods}>
      <Text variant="label">{t('payWith')}</Text>
      <Segmented label={t('payWith')} options={methods.map((m) => ({ value: m, label: t(`method.${m}`) }))} value={value} onChange={onChange} />
    </View>
  );
}

/** What happens next with the chosen method, under the book or pay button. */
export function MethodNote({ method, hold }: Readonly<{ method: PaymentMethod; hold: boolean }>) {
  const t = useTranslations('session');
  const key = { card: hold ? 'payByCard' : 'payByCardNow', cash: 'payAtSession' } as const;
  return <Text variant="label">{t(key[method])}</Text>;
}

const styles = StyleSheet.create({
  methods: { gap: 8 },
});
