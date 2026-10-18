'use client';
import { useTranslations } from 'next-intl';
import { Field, Segmented } from '@/components/ui';
import { useSessionLabels } from '@/lib/client/session-labels';
import { privateDraftOk, type PrivateDraft } from '@el-captain/rules/coach-form';
import onb from './onboarding.module.css';

export { privateBody, privateDraftOf, privateDraftOk, type PrivateDraft } from '@el-captain/rules/coach-form';

/**
 * Yes / No for private sessions, with the price and length when Yes, and a status line saying whether members can
 * request one. `active` is what's switched on right now (the saved settings on the profile page).
 */
export function PrivateSessionSettings({
  value,
  onChange,
  active,
}: Readonly<{ value: PrivateDraft; onChange: (v: PrivateDraft) => void; active: { price: number; duration: number } | null }>) {
  const t = useTranslations('coachEdit');
  const l = useSessionLabels();
  const ok = privateDraftOk(value);
  // What saving would switch on, to say when the choice on screen isn't live yet.
  const next = value.on && ok ? { price: Number(value.price), duration: Number(value.duration) } : null;
  let pending: 'privatePendingOff' | 'privatePendingOn' | 'privatePendingChange' | null = null;
  if (active && !value.on) pending = 'privatePendingOff';
  else if (!active && next) pending = 'privatePendingOn';
  else if (active && next && (active.price !== next.price || active.duration !== next.duration)) pending = 'privatePendingChange';
  return (
    <div className={onb.private}>
      <div className={onb.group}>
        <div className={onb.labelRow}>{t('privateOffer')}</div>
        <Segmented
          options={[
            [t('privateYes'), 'on'],
            [t('privateNo'), 'off'],
          ]}
          value={value.on ? 'on' : 'off'}
          onChange={(v) => onChange({ ...value, on: v === 'on' })}
        />
      </div>
      <div className={onb.privateStatus}>
        <span className={active ? 'tag tag-accent' : 'tag tag-past'}>{active ? t('privateOn') : t('privateOff')}</span>
        <span className='muted'>
          {active ? t('privateOnLine', { price: l.price(active.price), minutes: l.minutes(active.duration) }) : t('privateOffLine')}
        </span>
        {pending && <span className={onb.pending}>{t(pending)}</span>}
      </div>
      {value.on && (
        <>
          <div className='fields'>
            <Field label={t('privatePrice')}>
              <input
                className='input'
                inputMode='numeric'
                dir='ltr'
                placeholder='600'
                value={value.price}
                onChange={(e) => onChange({ ...value, price: e.target.value })}
              />
            </Field>
            <Field label={t('privateDuration')}>
              <input
                className='input'
                inputMode='numeric'
                dir='ltr'
                placeholder='60'
                value={value.duration}
                onChange={(e) => onChange({ ...value, duration: e.target.value })}
              />
            </Field>
          </div>
          <div className={ok ? `muted ${onb.hint}` : onb.error}>{t('privateRules')}</div>
        </>
      )}
    </div>
  );
}
