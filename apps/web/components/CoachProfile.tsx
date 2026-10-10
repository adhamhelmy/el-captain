'use client';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { PrivateRequestForm } from '@/components/PrivateRequestForm';
import { SessionCard } from '@/components/sessions';
import { Avatar, Back, initialsOf } from '@/components/ui';
import { getCoach } from '@/lib/client/coach-api';
import { listSessions } from '@/lib/client/session-api';
import type { PublicCoachDTO, SessionDTO } from '@/lib/server/dto';
import { sportName } from '@/lib/shared/coach-rules';
import onb from './onboarding.module.css';
import styles from './CoachProfile.module.css';

/** An approved coach's public profile; `area` is '' for guests and '/user' for members. Anyone else is a 404. */
export function CoachProfile({ id, area }: Readonly<{ id: string; area: '' | '/user' }>) {
  const t = useTranslations('coachProfile');
  const locale = useLocale();
  const [c, setC] = useState<PublicCoachDTO | null | undefined>(undefined);
  const [sessions, setSessions] = useState<SessionDTO[]>([]);
  const [asking, setAsking] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    getCoach(id)
      .then((r) => setC(r.ok ? r.data : null))
      .catch(() => setC(null));
  }, [id]);

  useEffect(() => {
    listSessions({ coach: id, limit: 12 })
      .then((r) => r.ok && setSessions(r.data))
      .catch(() => setSessions([]));
  }, [id]);

  if (c === null) notFound();
  if (!c) return null;

  const sports = c.sports.map((s) => sportName(s, locale));
  const links = [['Instagram', c.instagram], ['TikTok', c.tiktok], ...c.links.map((l) => [l.label, l.url])].filter(
    (l): l is [string, string] => !!l[1],
  );
  const takesRequests = c.privatePrice !== null && c.privateDuration !== null && c.venues.length > 0 && c.sports.length > 0;

  return (
    <div className={`page detail stack ${styles.page}`}>
      {area ? <Back href='/user/coaches'>{t('allCoaches')}</Back> : <Back href='/sessions'>{t('allSessions')}</Back>}
      <div className={styles.head}>
        <Avatar initials={initialsOf(c.name)} size={96} accent src={c.photoUrl} />
        <div className={styles.headText}>
          <div className={`display ${styles.name}`} dir='auto'>
            {c.name}
          </div>
          {c.city && (
            <div className={`muted ${styles.line}`}>
              <bdi>{c.city}</bdi>
            </div>
          )}
        </div>
        {takesRequests &&
          (area ? (
            <button type='button' className='btn' onClick={() => setAsking(!asking)}>
              {t('requestPrivate')}
            </button>
          ) : (
            <Link href={`/login?callbackUrl=/user/coaches/${c.id}`} className='btn'>
              {t('logInToRequest')}
            </Link>
          ))}
      </div>
      {sent && <div className={styles.sent}>{t('sent')}</div>}
      {asking && !sent && (
        <PrivateRequestForm
          coach={c}
          onSent={() => {
            setSent(true);
            setAsking(false);
          }}
        />
      )}
      {c.bio && (
        <div className={`muted ${styles.bio}`} dir='auto'>
          {c.bio}
        </div>
      )}
      {sports.length > 0 && (
        <section>
          <div className={`h3 ${styles.heading}`}>{t('sports')}</div>
          <div className={onb.chips}>
            {sports.map((name) => (
              <span key={name} className={onb.chip}>
                <bdi>{name}</bdi>
              </span>
            ))}
          </div>
        </section>
      )}
      {links.length > 0 && (
        <section className={`stack ${styles.links}`}>
          <div className={`h3 ${styles.heading}`}>{t('links')}</div>
          {links.map(([label, url]) => (
            <a key={`${label}${url}`} href={url} target='_blank' rel='noopener noreferrer nofollow' className={styles.link}>
              <bdi>{label}</bdi>
            </a>
          ))}
        </section>
      )}
      <section className={`stack ${styles.sessions}`}>
        <div className={`h3 ${styles.heading}`}>{t('upcoming')}</div>
        {sessions.length ? (
          <div className='grid-cards'>
            {sessions.map((s) => (
              <SessionCard key={s.id} s={s} href={`${area || ''}/sessions/${s.id}`} spots />
            ))}
          </div>
        ) : (
          <div className='muted'>{t('none')}</div>
        )}
      </section>
    </div>
  );
}
