'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Lightbox } from '@/components/Lightbox';
import { clockLength } from '@/lib/client/media';
import type { MediaDTO } from '@/lib/server/dto';
import { sportName } from '@/lib/shared/coach-rules';
import styles from './MediaGallery.module.css';

/** What a screen reader calls an item: its caption, or a generic name. */
const label = (m: MediaDTO, untitled: string) => m.caption ?? untitled;

/**
 * A coach's photos and videos as a square grid; picking one opens it in a Lightbox pop-up.
 * Give it a `key` that changes with the filter so the pop-up closes when the list does.
 */
export function MediaGallery({ items }: Readonly<{ items: MediaDTO[] }>) {
  const t = useTranslations('coachProfile');
  const locale = useLocale();
  const [open, setOpen] = useState<number | null>(null);
  const photos = items.filter((m) => m.kind === 'PHOTO').length;

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={`display ${styles.title}`}>{t('media')}</h2>
        <div className={styles.count}>{t('mediaCount', { photos, videos: items.length - photos })}</div>
      </div>

      <div className={styles.grid}>
        {items.map((m, i) => (
          <button key={m.id} type='button' className={styles.tile} onClick={() => setOpen(i)} aria-label={t('openMedia', { caption: label(m, t('untitled')) })}>
            {m.kind === 'VIDEO' ? (
              <video src={`${m.url}#t=0.1`} preload='metadata' muted playsInline className={styles.thumb} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- a Blob image
              <img src={m.url} alt='' loading='lazy' className={styles.thumb} />
            )}
            {m.kind === 'VIDEO' && <span className={styles.play} aria-hidden />}
            {m.sport && (
              <span className={styles.tileSport}>
                <bdi>{sportName(m.sport, locale)}</bdi>
              </span>
            )}
            {m.kind === 'VIDEO' && m.durationSec !== null && <span className={styles.tileDur}>{clockLength(m.durationSec)}</span>}
          </button>
        ))}
      </div>

      {open !== null && (
        <Lightbox label={label(items[open], t('untitled'))} index={open} count={items.length} onIndex={setOpen} onClose={() => setOpen(null)}>
          {items[open].kind === 'VIDEO' ? (
            <video key={items[open].id} src={items[open].url} controls autoPlay playsInline>
              {/* Coaches don't upload captions yet; the empty track keeps the player's captions menu in place. */}
              <track kind='captions' />
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- a Blob image
            <img key={items[open].id} src={items[open].url} alt={items[open].caption ?? ''} />
          )}
        </Lightbox>
      )}
    </section>
  );
}
