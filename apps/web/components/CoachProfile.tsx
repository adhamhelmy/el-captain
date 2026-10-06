import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Avatar, Back, TypeTag } from '@/components/ui';
import { isolate } from '@/i18n/locale';
import { coach, sessionsOfCoach } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';
import styles from './CoachProfile.module.css';

/** Coach profile; `area` prefixes links ('' for guests, '/user' for members). Only active coaches are shown. */
export function CoachProfile({ id, area }: Readonly<{ id: string; area: '' | '/user' }>) {
  const t = useTranslations('coachProfile');
  const tu = useTranslations('ui');
  const x = useSessionText();
  const c = coach(id);
  if (c?.status !== 'active') notFound();
  const upcoming = sessionsOfCoach(c.id).filter((s) => s.status === 'upcoming');
  const privateSession = upcoming.find((s) => s.type === 'private');

  return (
    <div className={`page detail stack ${styles.page}`}>
      {area ? (
        <Back href='/user/coaches'>{t('allCoaches')}</Back>
      ) : (
        <Back href='/sessions'>{t('allSessions')}</Back>
      )}
      <div className={styles.head}>
        <Avatar initials={x.initials(c)} size={96} accent />
        <div className={styles.headText}>
          <div className={`display ${styles.name}`} dir='auto'>
            {x.name(c)}
          </div>
          <div className={`muted ${styles.line}`}>
            {t('line', {
              specialty: x.category(c.specialty),
              location: isolate(c.location),
              rating: c.rating,
              reviews: tu('reviews', { count: c.reviews }),
            })}
          </div>
        </div>
        {privateSession && (
          <Link
            href={`${area}/sessions/${privateSession.id}`}
            className={`btn ${styles.bookPrivate}`}
          >
            {t('bookPrivate', { price: x.price(c.rate) })}
          </Link>
        )}
      </div>
      <div className={`muted ${styles.bio}`} dir='auto'>
        {c.bio}
      </div>
      <div>
        <div className={`h2 ${styles.heading}`}>
          {t('upcoming')}
        </div>
        <div className={`stack ${styles.list}`}>
          {upcoming.map((s) => (
            <Link key={s.id} href={`${area}/sessions/${s.id}`} className='row'>
              <div className={styles.group}>
                <TypeTag s={s} />
                <div>
                  <div dir='auto' className={styles.sessionTitle}>
                    {s.title}
                  </div>
                  <div className={`muted ${styles.when}`}>{x.when(s)}</div>
                </div>
              </div>
              <div className={styles.meta}>
                <span className={`muted ${styles.note}`}>{x.spots(s)}</span>
                <span className={`display ${styles.price}`}>
                  {x.price(s.price)}
                </span>
              </div>
            </Link>
          ))}
          {upcoming.length === 0 && (
            <div className={`muted ${styles.note}`}>{t('none')}</div>
          )}
        </div>
      </div>
    </div>
  );
}
