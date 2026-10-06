'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { notFound, useParams } from 'next/navigation';
import { Avatar, Back, Stats, Tag } from '@/components/ui';
import { sessionsOfUser, user, userSpent } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';
import detail from '../../../detail.module.css';

export default function AdminUserPage() {
  const t = useTranslations('admin');
  const tst = useTranslations('status');
  const x = useSessionText();
  const u = user(useParams<{ id: string }>().id);
  const [status, setStatus] = useState(u?.status); // Mock until wired up: PUT /api/admin/users/[id]
  if (!u || !status) notFound();
  const history = sessionsOfUser(u.id);
  const active = status === 'active';

  return (
    <div className={`page detail stack ${detail.page}`}>
      <Back href='/admin/users'>{t('backUsers')}</Back>
      <div className={detail.profile}>
        <Avatar initials={u.initials} size={80} />
        <div className={detail.profileText}>
          <div className={detail.nameRow}>
            <div className={`display ${detail.name}`} dir='auto'>
              {u.name}
            </div>
            <Tag kind={status}>{tst(status)}</Tag>
          </div>
          <div className={`muted ${detail.line}`}>
            <bdi>{u.email}</bdi> · <bdi>{u.phone}</bdi>
          </div>
        </div>
        <button
          type='button'
          className={active ? 'btn-ghost danger' : 'btn-ghost'}
          onClick={() => setStatus(active ? 'suspended' : 'active')}
        >
          {active ? t('suspendUser') : t('reactivate')}
        </button>
      </div>
      <Stats
        small
        items={[
          [history.length, t('stats.bookings')],
          [x.price(userSpent(u.id)), t('stats.totalSpent')],
          [x.monthYear(u.joined), t('stats.joined')],
          [x.ago(u.lastActive), t('stats.lastActive')],
        ]}
      />
      <div>
        <div className={`h3 ${detail.heading}`}>
          {t('history')}
        </div>
        <div className={`stack ${detail.list}`}>
          {history.map((s) => (
            <Link
              key={s.id}
              href={`/admin/sessions/${s.id}`}
              className={`row ${detail.row}`}
            >
              <div>
                <div dir='auto' className={detail.rowTitle}>
                  {s.title}
                </div>
                <div className={`muted ${detail.rowSub}`}>
                  <bdi>{x.coachName(s)}</bdi> · {x.when(s)}
                </div>
              </div>
              <div className={detail.rowMeta}>
                <Tag kind={s.status}>{tst(s.status)}</Tag>
                <span className={detail.price}>{x.price(s.price)}</span>
              </div>
            </Link>
          ))}
          {history.length === 0 && (
            <div className={`muted ${detail.empty}`}>
              {t('noBookings')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
