'use client';
import { useTranslations } from 'next-intl';
import { LINK_LABEL_MAX, MAX_LINKS } from '@/lib/shared/coach-rules';
import styles from './onboarding.module.css';

/** A link row being edited; `key` keeps React rows stable while they're reordered. */
export type LinkDraft = { key: string; label: string; url: string };

/** What the API takes: filled-in rows only (a freshly added, untouched row isn't a link yet), without the row keys. */
export const toLinks = (rows: LinkDraft[]) =>
  rows.filter((l) => l.label.trim() || l.url.trim() !== 'https://').map(({ label, url }) => ({ label, url }));

/** Extra profile links: add, edit, reorder, remove. */
export function LinksEditor({ links, onChange }: Readonly<{ links: LinkDraft[]; onChange: (l: LinkDraft[]) => void }>) {
  const t = useTranslations('onboarding');
  const set = (i: number, patch: Partial<LinkDraft>) => onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (i: number, by: -1 | 1) => {
    const next = [...links];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    onChange(next);
  };

  return (
    <div className={styles.list}>
      {links.map((l, i) => (
        // Rows have no stable id until saved; index keys are fine because inputs are fully controlled.
        <div key={l.key} className={styles.linkRow}>
          <input
            className='input'
            dir='auto'
            maxLength={LINK_LABEL_MAX}
            placeholder={t('linkLabel')}
            aria-label={t('linkLabel')}
            value={l.label}
            onChange={(e) => set(i, { label: e.target.value })}
          />
          <input
            className='input'
            dir='ltr'
            type='url'
            placeholder={t('linkUrl')}
            aria-label={t('linkUrl')}
            value={l.url}
            onChange={(e) => set(i, { url: e.target.value })}
          />
          <div className={styles.rowActions}>
            <button type='button' className='btn-ghost sm' disabled={i === 0} onClick={() => move(i, -1)} aria-label={t('moveUp')}>
              ↑
            </button>
            <button type='button' className='btn-ghost sm' disabled={i === links.length - 1} onClick={() => move(i, 1)} aria-label={t('moveDown')}>
              ↓
            </button>
            <button type='button' className='btn-ghost sm danger' onClick={() => onChange(links.filter((_, j) => j !== i))}>
              {t('remove')}
            </button>
          </div>
        </div>
      ))}
      {links.length < MAX_LINKS && (
        <div>
          <button
            type='button'
            className='btn-ghost sm'
            onClick={() => onChange([...links, { key: crypto.randomUUID(), label: '', url: 'https://' }])}
          >
            {t('addLink')}
          </button>
        </div>
      )}
    </div>
  );
}
