'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Field, Tag } from '@/components/ui';
import { addVenue, archiveVenue, editVenue, listVenues, type VenueBody } from '@/lib/client/session-api';
import type { VenueDTO } from '@/lib/server/dto';
import { venueProblems, type VenueField } from '@/lib/shared/session-rules';
import onb from './onboarding.module.css';

const EMPTY: VenueBody = { name: '', address: '', city: '', mapUrl: '' };

/** The coach's venues. Each venue saves on its own; archiving hides it from new sessions. */
export function VenueEditor() {
  const t = useTranslations('coachEdit');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const [venues, setVenues] = useState<VenueDTO[]>([]);
  const [editing, setEditing] = useState('');
  const [draft, setDraft] = useState<VenueBody>(EMPTY);
  const [bad, setBad] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    listVenues()
      .then((r) => r.ok && setVenues(r.data))
      .catch(() => setVenues([]));
  }, []);

  const open = (v?: VenueDTO) => {
    setEditing(v?.id ?? 'new');
    setDraft(v ? { name: v.name, address: v.address, city: v.city, mapUrl: v.mapUrl ?? '' } : EMPTY);
    setBad([]);
    setError('');
  };

  async function save() {
    const problems = venueProblems(draft);
    setBad(problems);
    if (problems.length) return setError(te('invalid_venue'));
    const r = editing === 'new' ? await addVenue(draft) : await editVenue(editing, draft);
    if (!r.ok) {
      setBad(r.fields ?? []);
      return setError(te(r.code === 'invalid_venue' ? 'invalid_venue' : 'generic'));
    }
    setVenues(editing === 'new' ? [...venues, r.data] : venues.map((v) => (v.id === r.data.id ? r.data : v)));
    setEditing('');
  }

  async function archive(id: string) {
    const r = await archiveVenue(id);
    if (r.ok) setVenues(venues.map((v) => (v.id === id ? r.data : v)));
    else setError(te('generic'));
  }

  const cls = (f: VenueField) => (bad.includes(f) ? 'input invalid' : 'input');

  return (
    <div className={`stack ${onb.group}`}>
      <div className='muted'>{t('venuesHint')}</div>
      {venues.map((v) => (
        <div key={v.id} className='row'>
          <div>
            <div dir='auto'>
              <b>{v.name}</b> {v.archived && <Tag kind='past'>{t('archived')}</Tag>}
            </div>
            <div dir='auto' className='muted'>
              {v.address} · {v.city}
            </div>
          </div>
          {!v.archived && (
            <div className='chips'>
              <button type='button' className='btn-ghost sm' onClick={() => open(v)}>
                {t('editVenue')}
              </button>
              <button type='button' className='btn-ghost sm danger' onClick={() => archive(v.id)}>
                {t('archive')}
              </button>
            </div>
          )}
        </div>
      ))}
      {editing ? (
        <div className='card stack'>
          <div className='fields'>
            <Field label={t('venueName')}>
              <input className={cls('name')} dir='auto' value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label={t('city')}>
              <input className={cls('city')} dir='auto' value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
            </Field>
          </div>
          <Field label={t('address')}>
            <input className={cls('address')} dir='auto' value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
          </Field>
          <Field label={t('mapUrl')}>
            <input className={cls('mapUrl')} dir='ltr' value={draft.mapUrl} onChange={(e) => setDraft({ ...draft, mapUrl: e.target.value })} />
          </Field>
          <div className={`muted ${onb.hint}`}>{t('venueRules')}</div>
          <div className='chips'>
            <button type='button' className='btn' onClick={save}>
              {t('saveVenue')}
            </button>
            <button type='button' className='btn-ghost' onClick={() => setEditing('')}>
              {tc('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button type='button' className='btn-ghost' onClick={() => open()}>
            {t('addVenue')}
          </button>
        </div>
      )}
      {error && <div className={onb.error}>{error}</div>}
    </div>
  );
}
