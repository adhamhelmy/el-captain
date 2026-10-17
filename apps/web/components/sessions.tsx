import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Tag } from '@/components/ui';
import { useSessionLabels } from '@/lib/client/session-labels';
import type { SessionDTO } from '@/lib/server/dto';
import { sessionPhase } from '@/lib/shared/session-rules';
import styles from './ui.module.css';

export function TypeTag({ type }: Readonly<{ type: SessionDTO['type'] }>) {
  const l = useSessionLabels();
  return <Tag kind={type.toLowerCase()}>{l.type(type)}</Tag>;
}

/** Upcoming, past or cancelled. */
export function PhaseTag({ s }: Readonly<{ s: Pick<SessionDTO, 'status'> & { startsAt: Date | string } }>) {
  const tst = useTranslations('status');
  const phase = sessionPhase(s);
  return <Tag kind={phase}>{tst(phase)}</Tag>;
}

/** The session's cover photo as a wide banner on its page; nothing when it has none. */
export function SessionCover({ url }: Readonly<{ url: string | null }>) {
  // eslint-disable-next-line @next/next/no-img-element -- a Blob image
  return url ? <img src={url} alt='' className='session-cover' /> : null;
}

/** A session in a grid: cover or stripes, sport, type (or `badge`), title, coach, location, start and price. */
export function SessionCard({ s, href, badge }: Readonly<{ s: SessionDTO; href: string; badge?: React.ReactNode }>) {
  const l = useSessionLabels();
  return (
    <Link href={href} className='scard'>
      <div className={s.coverUrl ? 'scard-head has-cover' : 'scard-head'}>
        {s.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- a Blob image
          <img src={s.coverUrl} alt='' loading='lazy' className='scard-cover' />
        )}
        <span className='scard-cat'>{l.sport(s.sport)}</span>
        {badge ?? <TypeTag type={s.type} />}
      </div>
      <div className='scard-body'>
        <div dir='auto' className={styles.cardTitle}>
          {l.title(s)}
        </div>
        <div className={`muted ${styles.cardMeta}`}>
          <bdi>{s.coach.name}</bdi> · <bdi>{s.venue.name}</bdi>
        </div>
        <div className='scard-foot'>
          <span>{l.when(s.startsAt)}</span>
          <span className={styles.price}>{l.price(s.price)}</span>
        </div>
      </div>
    </Link>
  );
}
