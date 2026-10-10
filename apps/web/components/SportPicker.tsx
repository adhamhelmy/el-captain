'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { addSport, searchSports } from '@/lib/client/coach-api';
import { MAX_SPORTS, sportKey, sportName } from '@/lib/shared/coach-rules';
import type { SportDTO } from '@/lib/server/dto';
import styles from './onboarding.module.css';

const SHOWN = 16;

/** Search and pick sports from a grid; offers to add one that isn't listed, and catches duplicates. */
export function SportPicker({ selected, onChange }: Readonly<{ selected: SportDTO[]; onChange: (s: SportDTO[]) => void }>) {
  const t = useTranslations('onboarding');
  const te = useTranslations('errors');
  const locale = useLocale();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SportDTO[]>([]);
  const [suggest, setSuggest] = useState<SportDTO | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(async () => {
      const res = await searchSports(q.trim());
      if (res.ok) setResults(res.data);
    }, 200);
    return () => clearTimeout(timer);
  }, [q]);

  const chosen = new Set(selected.map((s) => s.id));
  const full = selected.length >= MAX_SPORTS;
  const typed = q.trim();
  const exact = [...results, ...selected].some((s) => sportKey(s.nameEn) === sportKey(typed) || (s.nameAr && sportKey(s.nameAr) === sportKey(typed)));
  const options = results.filter((s) => !chosen.has(s.id)).slice(0, SHOWN);

  function pick(s: SportDTO) {
    if (!chosen.has(s.id) && !full) onChange([...selected, s]);
    setQ('');
    setSuggest(null);
  }

  async function add() {
    setError('');
    const res = await addSport(typed);
    if (res.ok) return pick(res.data);
    if (res.code === 'sport_exists' && res.sport) return setSuggest(res.sport);
    setError(te(res.code === 'invalid_profile' ? 'invalid_profile' : 'generic'));
  }

  return (
    <div className={styles.picker}>
      <input
        className={`input ${styles.search}`}
        dir='auto'
        placeholder={t('sportSearch')}
        aria-label={t('sportSearch')}
        value={q}
        disabled={full}
        onChange={(e) => {
          setQ(e.target.value);
          setSuggest(null);
        }}
      />

      <div className={styles.pickerGroup}>
        <div className={styles.labelRow}>
          <span>{t('yourSports')}</span>
          <span className={styles.counter}>
            {selected.length} / {MAX_SPORTS}
          </span>
        </div>
        <div className={styles.chips}>
          {selected.map((s) => (
            <button
              key={s.id}
              type='button'
              className={`${styles.chipOn} ${s.status === 'PENDING' ? styles.chipPending : ''}`}
              title={s.status === 'PENDING' ? t('newSport') : undefined}
              aria-label={t('removeSport', { name: sportName(s, locale) })}
              onClick={() => onChange(selected.filter((x) => x.id !== s.id))}
            >
              <bdi>{sportName(s, locale)}</bdi>
              <span aria-hidden className={styles.chipX}>
                ×
              </span>
            </button>
          ))}
          {selected.length === 0 && <span className={styles.nothing}>{t('noSportsYet')}</span>}
        </div>
      </div>

      {suggest && (
        <div className='between'>
          <span>{t('didYouMean', { name: sportName(suggest, locale) })}</span>
          <button type='button' className='btn-ghost sm' onClick={() => pick(suggest)}>
            {t('useIt')}
          </button>
        </div>
      )}

      {!full && (
        <div className={styles.pickerGroup}>
          <div className={styles.labelRow}>{typed ? t('sportMatches') : t('sportsOnApp')}</div>
          <div className={styles.chips}>
            {typed.length >= 2 && !exact && !suggest && (
              <button type='button' className={styles.chipAdd} onClick={add}>
                {t('addSport', { name: typed })}
              </button>
            )}
            {options.map((s) => (
              <button key={s.id} type='button' className={styles.chipOption} onClick={() => pick(s)}>
                <bdi>{sportName(s, locale)}</bdi>
              </button>
            ))}
          </div>
          <div className={styles.photoHint}>{t('newSportNote')}</div>
        </div>
      )}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
