'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { addSport, searchSports } from '@/lib/coach-api';
import { MAX_SPORTS, sportKey, sportName } from '@/lib/coach-rules';
import type { SportDTO } from '@/lib/dto';
import styles from './onboarding.module.css';

/** Search and pick sports; offers to add one that isn't listed, and catches duplicates. */
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
  const exact = results.some((s) => sportKey(s.nameEn) === sportKey(typed) || (s.nameAr && sportKey(s.nameAr) === sportKey(typed)));

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
    <div className={`stack ${styles.group}`}>
      {selected.length > 0 && (
        <div className={styles.chips}>
          {selected.map((s) => (
            <span
              key={s.id}
              className={`${styles.chip} ${s.status === 'PENDING' ? styles.chipPending : ''}`}
              title={s.status === 'PENDING' ? t('newSport') : undefined}
            >
              <bdi>{sportName(s, locale)}</bdi>
              <button type='button' className={styles.chipX} aria-label={t('remove')} onClick={() => onChange(selected.filter((x) => x.id !== s.id))}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {!full && (
        <>
          <input
            className='input'
            dir='auto'
            placeholder={t('sportSearch')}
            aria-label={t('sportSearch')}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSuggest(null);
            }}
          />
          <div className={styles.results}>
            {results
              .filter((s) => !chosen.has(s.id))
              .slice(0, 8)
              .map((s) => (
                <button key={s.id} type='button' className={styles.result} onClick={() => pick(s)}>
                  <bdi>{sportName(s, locale)}</bdi>
                </button>
              ))}
            {typed.length >= 2 && !exact && !suggest && (
              <button type='button' className={styles.result} onClick={add}>
                {t('addSport', { name: typed })}
              </button>
            )}
          </div>
        </>
      )}
      {suggest && (
        <div className='between'>
          <span>{t('didYouMean', { name: sportName(suggest, locale) })}</span>
          <button type='button' className='btn-ghost sm' onClick={() => pick(suggest)}>
            {t('useIt')}
          </button>
        </div>
      )}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
