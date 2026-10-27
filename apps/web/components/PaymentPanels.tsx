'use client';
import { useTranslations } from 'next-intl';
import { Segmented } from '@/components/ui';
import type { PaymentMethod } from '@/lib/shared/payment-rules';
import styles from './SessionDetail.module.css';

/** Card or cash, when the session offers both. */
export function MethodPicker({ methods, value, onChange }: Readonly<{ methods: PaymentMethod[]; value: PaymentMethod; onChange: (m: PaymentMethod) => void }>) {
  const t = useTranslations('session');
  if (methods.length < 2) return null;
  return (
    <div className={styles.methods}>
      <div className={`muted ${styles.small}`}>{t('payWith')}</div>
      <Segmented options={methods.map((m) => [t(`method.${m}`), m])} value={value} onChange={onChange} />
    </div>
  );
}

/** What happens next with the chosen method, under the book or pay button. */
export function MethodNote({ method, hold }: Readonly<{ method: PaymentMethod; hold: boolean }>) {
  const t = useTranslations('session');
  const key = { card: hold ? 'payByCard' : 'payByCardNow', cash: 'payAtSession' } as const;
  return <div className={`dim ${styles.fine}`}>{t(key[method])}</div>;
}
