'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Notice } from '@/components/Drawer';
import { Tag } from '@/components/ui';
import { VenueDrawer, type VenueSaved } from '@/components/VenueDrawer';
import { listVenues } from '@/lib/client/session-api';
import type { CoachVenueDTO } from '@/lib/server/dto';
import styles from './page.module.css';

/** The coach's locations. Add and edit happen in a drawer; the coach always keeps at least one. */
export default function VenuesPage() {
  const t = useTranslations('venues');
  const [venues, setVenues] = useState<CoachVenueDTO[] | null>(null);
  const [open, setOpen] = useState<CoachVenueDTO | 'new' | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    listVenues()
      .then((r) => setVenues(r.ok ? r.data : []))
      .catch(() => setVenues([]));
  }, []);

  function saved({ venue, action }: VenueSaved) {
    const list = venues ?? [];
    const upcoming = list.find((v) => v.id === venue.id)?.upcoming ?? 0;
    const next = { ...venue, upcoming };
    setVenues(action === 'added' ? [...list, next] : list.map((v) => (v.id === venue.id ? next : v)));
    setNotice(
      t(action === 'archived' ? 'archivedNotice' : action, {
        name: venue.name,
      }),
    );
    setOpen(null);
  }

  const line = (v: CoachVenueDTO) => t('line', { address: v.address, city: v.city });
  function edit(v: CoachVenueDTO) {
    if (v.archived) return <Tag kind='past'>{t('archived')}</Tag>;
    return (
      <button type='button' className={`btn-ghost sm ${styles.edit}`} onClick={() => setOpen(v)}>
        {t('edit')}
      </button>
    );
  }

  return (
    <div className={`page stack ${styles.page}`}>
      <div className='between'>
        <div>
          <div className='title'>{t('title')}</div>
          <div className={`muted ${styles.sub}`}>{t('sub')}</div>
        </div>
        <button type='button' className='btn' onClick={() => setOpen('new')}>
          {t('add')}
        </button>
      </div>

      {notice && <Notice onClose={() => setNotice('')}>{notice}</Notice>}

      {venues?.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>{t('emptyTitle')}</div>
          <div className='muted'>{t('emptyBody')}</div>
          <button type='button' className='btn' onClick={() => setOpen('new')}>
            {t('addFirst')}
          </button>
        </div>
      )}

      {!!venues?.length && (
        <>
          <div className={`table ${styles.cols} ${styles.desktop}`}>
            <div className='tr th'>
              <span>{t('colName')}</span>
              <span>{t('colAddress')}</span>
              <span>{t('colMap')}</span>
              <span>{t('colSessions')}</span>
              <span />
            </div>
            {venues.map((v) => (
              <div key={v.id} className='tr'>
                <span dir='auto' className={styles.name}>
                  {v.name}
                </span>
                <span dir='auto' className='muted'>
                  {line(v)}
                </span>
                <span>
                  {v.mapUrl ? (
                    <a href={v.mapUrl} target='_blank' rel='noopener noreferrer' className={styles.map}>
                      {t('open')}
                    </a>
                  ) : (
                    <span className='dim'>—</span>
                  )}
                </span>
                <span className='muted'>{t('upcoming', { count: v.upcoming })}</span>
                <span className={styles.end}>{edit(v)}</span>
              </div>
            ))}
          </div>

          <div className={`${styles.cards} ${styles.mobile}`}>
            {venues.map((v) => (
              <div key={v.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.cardText}>
                    <span dir='auto' className={styles.name}>
                      {v.name}
                    </span>
                    <span dir='auto' className={styles.cardLine}>
                      {line(v)}
                    </span>
                  </span>
                  {edit(v)}
                </div>
                <div className={styles.cardMeta}>
                  {v.mapUrl && (
                    <a href={v.mapUrl} target='_blank' rel='noopener noreferrer' className={styles.map}>
                      {t('map')}
                    </a>
                  )}
                  {v.upcoming > 0 && <span className='dim'>{t('upcoming', { count: v.upcoming })}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {open && <VenueDrawer venue={open === 'new' ? undefined : open} onClose={() => setOpen(null)} onSaved={saved} />}
    </div>
  );
}
