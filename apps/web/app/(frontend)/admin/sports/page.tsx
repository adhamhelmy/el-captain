'use client';
import { sportName } from '@/lib/shared/coach-rules';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Field, Tag } from '@/components/ui';
import { adminAddSport, adminEditSport, adminListSports, adminMergeSport, type AdminSport, type Result } from '@/lib/client/coach-api';
import styles from './page.module.css';

const KNOWN_ERRORS = ['sport_exists', 'invalid_profile'] as const;
type Names = { nameEn: string; nameAr: string };

export default function AdminSportsPage() {
  const t = useTranslations('adminSports');
  const tr = useTranslations('adminReview');
  const te = useTranslations('errors');
  const locale = useLocale();
  const [list, setList] = useState<AdminSport[]>([]);
  const [draft, setDraft] = useState<Names>({ nameEn: '', nameAr: '' });
  const [edits, setEdits] = useState<Record<string, Names>>({});
  const [error, setError] = useState('');

  const load = useCallback(() => adminListSports().then((r) => r.ok && setList(r.data)), []);
  useEffect(() => {
    adminListSports().then((r) => r.ok && setList(r.data));
  }, []);

  async function run(p: Promise<Result<unknown>>) {
    const r = await p;
    if (!r.ok) {
      setError(te(KNOWN_ERRORS.find((k) => k === r.code) ?? 'generic'));
      return false;
    }
    setError('');
    setEdits({});
    load();
    return true;
  }

  async function add() {
    if (await run(adminAddSport(draft.nameEn, draft.nameAr))) setDraft({ nameEn: '', nameAr: '' });
  }

  const names = (s: AdminSport) => edits[s.id] ?? { nameEn: s.nameEn, nameAr: s.nameAr ?? '' };
  const setNames = (s: AdminSport, patch: Partial<Names>) => setEdits({ ...edits, [s.id]: { ...names(s), ...patch } });

  return (
    <div className='page stack'>
      <div className='title'>{t('title')}</div>
      <div className={`card ${styles.add}`}>
        <Field label={tr('nameEn')}>
          <input className='input' value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} />
        </Field>
        <Field label={tr('nameAr')}>
          <input className='input' dir='rtl' value={draft.nameAr} onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })} />
        </Field>
        <button type='button' className='btn' disabled={!draft.nameEn.trim()} onClick={add}>
          {t('add')}
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {list.length === 0 && <div className='muted'>{t('empty')}</div>}
      <div className={`stack ${styles.list}`}>
        {list.map((s) => (
          <div key={s.id} className={`card ${styles.row}`}>
            <input className='input' aria-label={tr('nameEn')} value={names(s).nameEn} onChange={(e) => setNames(s, { nameEn: e.target.value })} />
            <input
              className='input'
              dir='rtl'
              aria-label={tr('nameAr')}
              value={names(s).nameAr}
              onChange={(e) => setNames(s, { nameAr: e.target.value })}
            />
            <span className='muted'>{t('coaches', { count: s.coachCount })}</span>
            {s.status === 'PENDING' ? <Tag kind='pending'>{t('pending')}</Tag> : <span />}
            <button
              type='button'
              className='btn-ghost sm'
              onClick={() => run(adminEditSport(s.id, { ...names(s), ...(s.status === 'PENDING' && { approve: true }) }))}
            >
              {s.status === 'PENDING' ? tr('approveSport') : t('save')}
            </button>
            <select
              className='input'
              aria-label={t('mergeInto')}
              value=''
              onChange={(e) => e.target.value && run(adminMergeSport(s.id, e.target.value))}
            >
              <option value='' disabled>
                {t('mergeInto')}
              </option>
              {list
                .filter((x) => x.id !== s.id && x.status === 'APPROVED')
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {sportName(x, locale)}
                  </option>
                ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
