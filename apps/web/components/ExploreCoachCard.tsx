import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Avatar, initialsOf } from '@/components/ui';
import type { PublicCoachDTO } from '@/lib/server/dto';
import { sportName } from '@/lib/shared/coach-rules';
import styles from './Explore.module.css';

/** Average stars and how many reviews. Coaches have no reviews yet, so nothing passes one for now. */
export type Rating = { average: number; count: number };

/** The profile city, or else the cities of the coach's venues. */
const placeOf = (c: PublicCoachDTO) => c.city || [...new Set(c.venues.map((v) => v.city).filter(Boolean))].join(' · ');

/** A coach on Explore, shaped like a session card: photo and rating, name, sports as tags, then where they train. */
export function ExploreCoachCard({ c, href, rating }: Readonly<{ c: PublicCoachDTO; href: string; rating?: Rating | null }>) {
  const t = useTranslations('explore');
  const tu = useTranslations('ui');
  const format = useFormatter();
  const locale = useLocale();
  const place = placeOf(c);
  return (
    <Link href={href} className='scard'>
      <div className='scard-head'>
        <Avatar initials={initialsOf(c.name)} size={64} src={c.photoUrl} accent />
        {rating ? (
          <span className='tag tag-accent' title={tu('reviews', { count: rating.count })}>
            <Star size={12} aria-hidden className={styles.star} />
            {format.number(rating.average, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ({format.number(rating.count)})
          </span>
        ) : (
          <span className='tag tag-past'>
            <Star size={12} aria-hidden className={styles.starEmpty} />
            {t('noReviews')}
          </span>
        )}
      </div>
      <div className='scard-body'>
        <div dir='auto' className={styles.cardTitle}>
          {c.name}
        </div>
        {c.sports.length > 0 && (
          <div className={styles.tags}>
            {c.sports.map((s) => (
              <span key={s.id} className='tag tag-accent'>
                {sportName(s, locale)}
              </span>
            ))}
          </div>
        )}
        <div className={`scard-foot ${styles.place}`}>
          <MapPin size={14} aria-hidden />
          {place ? <bdi>{place}</bdi> : <span>{t('noLocation')}</span>}
        </div>
      </div>
    </Link>
  );
}
