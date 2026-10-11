'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Drawer } from '@/components/Drawer';
import { Field } from '@/components/ui';
import { addVenue, archiveVenue, editVenue, type VenueBody } from '@/lib/client/session-api';
import type { VenueDTO } from '@/lib/server/dto';
import { VENUE, venueProblems, type VenueField } from '@/lib/shared/session-rules';
import styles from './VenueDrawer.module.css';

const EMPTY: VenueBody = { name: '', address: '', city: '', mapUrl: '' };

export type VenueSaved = {
  venue: VenueDTO;
  action: 'added' | 'saved' | 'archived';
};

/** Add or edit one location in a drawer. It saves straight away and hands the result back. */
export function VenueDrawer({
  venue,
  onClose,
  onSaved,
}: Readonly<{
  venue?: VenueDTO;
  onClose: () => void;
  onSaved: (r: VenueSaved) => void;
}>) {
  const t = useTranslations('venues');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const [draft, setDraft] = useState<VenueBody>(
    venue
      ? {
          name: venue.name,
          address: venue.address,
          city: venue.city,
          mapUrl: venue.mapUrl ?? '',
        }
      : EMPTY,
  );
  const [bad, setBad] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const problem = t('problem', {
    nameMax: VENUE.name,
    addressMax: VENUE.address,
    cityMax: VENUE.city,
  });

  async function save() {
    const problems = venueProblems(draft);
    setBad(problems);
    if (problems.length) return setError(problem);
    setBusy(true);
    const r = venue ? await editVenue(venue.id, draft) : await addVenue(draft);
    setBusy(false);
    if (!r.ok) {
      setBad(r.fields ?? []);
      return setError(r.code === 'invalid_venue' ? problem : te('generic'));
    }
    onSaved({ venue: r.data, action: venue ? 'saved' : 'added' });
  }

  async function archive() {
    if (!venue) return;
    setBusy(true);
    const r = await archiveVenue(venue.id);
    setBusy(false);
    if (!r.ok) return setError(te(r.code === 'last_venue' ? 'last_venue' : 'generic'));
    onSaved({ venue: r.data, action: 'archived' });
  }

  const input = (f: VenueField, props: { dir: 'auto' | 'ltr'; placeholder?: string }) => (
    <input
      className={bad.includes(f) ? 'input invalid' : 'input'}
      value={draft[f]}
      aria-invalid={bad.includes(f)}
      onChange={(e) => setDraft({ ...draft, [f]: e.target.value })}
      {...props}
    />
  );

  return (
    <Drawer
      title={venue ? t('editTitle') : t('newTitle')}
      onClose={onClose}
      footer={
        <div className={styles.actions}>
          <button type='button' className={`btn ${styles.save}`} disabled={busy} onClick={save}>
            {venue ? t('save') : t('create')}
          </button>
          <button type='button' className='btn-ghost' onClick={onClose}>
            {tc('cancel')}
          </button>
          {venue && !venue.archived && (
            <button type='button' className={`btn-ghost danger ${styles.archive}`} disabled={busy} onClick={archive}>
              {t('archive')}
            </button>
          )}
        </div>
      }
    >
      <Field label={t('name')}>{input('name', { dir: 'auto', placeholder: t('namePlaceholder') })}</Field>
      <Field label={t('address')}>
        {input('address', {
          dir: 'auto',
          placeholder: t('addressPlaceholder'),
        })}
      </Field>
      <Field label={t('city')}>{input('city', { dir: 'auto' })}</Field>
      <Field label={t('mapUrl')}>
        {input('mapUrl', {
          dir: 'ltr',
          placeholder: 'https://maps.app.goo.gl/…',
        })}
      </Field>
      <div className={styles.hint}>{t('mapHint')}</div>
      {error && <div className={styles.error}>{error}</div>}
    </Drawer>
  );
}
