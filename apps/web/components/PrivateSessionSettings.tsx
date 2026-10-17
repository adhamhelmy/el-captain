'use client';
import { useTranslations } from 'next-intl';
import { Field, Segmented } from '@/components/ui';
import { useSessionLabels } from '@/lib/client/session-labels';
import { privateSettingsOk } from '@/lib/shared/session-rules';
import onb from './onboarding.module.css';

/** The private-session switch and the price and length as typed. Off clears both when saved. */
export type PrivateDraft = { on: boolean; price: string; duration: string };

/** A blank field is "not set" (null), anything else is read as a number. */
const optionalNumber = (v: string) => (v.trim() === '' ? null : Number(v));

export const privateDraftOf = (price: number | null, duration: number | null): PrivateDraft => ({
  on: price !== null && duration !== null,
  price: price === null ? '' : String(price),
  duration: duration === null ? '' : String(duration),
});

/** Off can always be saved; on needs a valid price and length. */
export function privateDraftOk({ on, price, duration }: PrivateDraft) {
  const p = optionalNumber(price);
  const d = optionalNumber(duration);
  return !on || (p !== null && d !== null && privateSettingsOk(p, d));
}

/** What a profile save sends for private sessions. */
export const privateBody = (draft: PrivateDraft) =>
  draft.on
    ? { privatePrice: optionalNumber(draft.price), privateDuration: optionalNumber(draft.duration) }
    : { privatePrice: null, privateDuration: null };

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
