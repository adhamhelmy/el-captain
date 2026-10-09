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

/** A session in a grid: sport, type (or `badge`), title, coach, length, start and price; `spots` adds what's left. */
export function SessionCard({ s, href, spots, badge }: Readonly<{ s: SessionDTO; href: string; spots?: boolean; badge?: React.ReactNode }>) {
  const l = useSessionLabels();
  return (
    <Link href={href} className='scard'>
      <div className='scard-head'>
        <span className='scard-cat'>{l.sport(s.sport)}</span>
        {badge ?? <TypeTag type={s.type} />}
      </div>
      <div className='scard-body'>
        <div dir='auto' className={styles.cardTitle}>
          {l.title(s)}
        </div>
        <div className={`muted ${styles.cardMeta}`}>
          <bdi>{s.coach.name}</bdi> · {l.minutes(s.durationMin)}
          {spots && ` · ${l.spots(s)}`}
        </div>
        <div className='scard-foot'>
          <span>{l.when(s.startsAt)}</span>
          <span className={styles.price}>{l.price(s.price)}</span>
        </div>
      </div>
    </Link>
  );
}
