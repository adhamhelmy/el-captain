'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { notFound, useParams } from 'next/navigation';
import { Avatar, Back, Stats, Tag, TypeTag } from '@/components/ui';
import { coach, fill, sessionsOfCoach } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';
import detail from '../../../detail.module.css';
import styles from './page.module.css';

// The status button's label (message key) and the status it switches to.
const TOGGLE: Partial<Record<string, ['suspend' | 'reject' | 'reinstate', string]>> = {
  active: ['suspend', 'suspended'],
  pending: ['reject', 'rejected'],
};

export default function AdminCoachPage() {
  const t = useTranslations('admin');
  const tst = useTranslations('status');
  const tu = useTranslations('ui');
  const x = useSessionText();
  const c = coach(useParams<{ id: string }>().id);
  const [status, setStatus] = useState(c?.status); // Mock until wired up: PUT /api/admin/coaches/[id]
  if (!c || !status) notFound();
  const list = sessionsOfCoach(c.id);
  const toggle = TOGGLE[status] ?? ['reinstate', 'active'];

  return (
    <div className={`page detail stack ${detail.page}`}>
      <Back href='/admin/coaches'>{t('backCoaches')}</Back>
      <div className={detail.profile}>
        <Avatar initials={x.initials(c)} size={80} accent />
        <div className={detail.profileText}>
          <div className={detail.nameRow}>
            <div className={`display ${detail.name}`} dir='auto'>
              {x.name(c)}
            </div>
            <Tag kind={status}>{tst(status)}</Tag>
          </div>
          <div className={`muted ${detail.line}`}>
            {x.category(c.specialty)} · <bdi>{c.location}</bdi> · <bdi>{c.email}</bdi>
          </div>
        </div>
        <div className={detail.actions}>
          {status === 'pending' && (
            <button
              type='button'
              className={`btn ${styles.approve}`}
              onClick={() => setStatus('active')}
            >
              {t('approve')}
            </button>
          )}
          <button
            type='button'
            className={toggle[1] === 'active' ? 'btn-ghost' : 'btn-ghost danger'}
            onClick={() => setStatus(toggle[1] as typeof status)}
          >
            {t(toggle[0])}
          </button>
        </div>
      </div>
      <Stats
        small
        items={[
          [list.length, t('stats.listed')],
          [c.clients, t('stats.clients')],
          [`${c.rating} ★`, tu('reviews', { count: c.reviews })],
          [x.price(c.revenue), t('stats.revenue30')],
        ]}
      />
      <div>
        <div className={`h3 ${detail.headingSm}`}>
          {t('bio')}
        </div>
        <div className={`muted ${detail.description} ${styles.bio}`} dir='auto'>
          {c.bio}
        </div>
      </div>
      <div>
        <div className={`h3 ${detail.heading}`}>
          {t('sessions')}
        </div>
        <div className={`stack ${detail.list}`}>
          {list.map((s) => (
            <Link
              key={s.id}
              href={`/admin/sessions/${s.id}`}
              className={`row ${detail.row}`}
            >
              <div className={detail.rowGroup}>
                <TypeTag s={s} />
                <div>
                  <div dir='auto' className={detail.rowTitle}>
                    {s.title}
                  </div>
                  <div className={`muted ${detail.rowSub}`}>
                    {x.when(s)}
                  </div>
                </div>
              </div>
              <div className={detail.rowMeta}>
                <span className={`muted ${detail.count}`}>
                  {fill(s)}
                </span>
                <Tag kind={s.status}>{tst(s.status)}</Tag>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
