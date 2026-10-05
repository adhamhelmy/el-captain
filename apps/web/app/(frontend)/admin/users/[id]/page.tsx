'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { notFound, useParams } from 'next/navigation';
import { Avatar, Back, Stats, Tag } from '@/components/ui';
import { sessionsOfUser, user, userSpent } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';

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
    <div className='page detail stack' style={{ maxWidth: 960, gap: 28 }}>
      <Back href='/admin/users'>{t('backUsers')}</Back>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <Avatar initials={u.initials} size={80} fontSize={26} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className='display' dir='auto' style={{ fontSize: 52, lineHeight: 1 }}>
              {u.name}
            </div>
            <Tag kind={status}>{tst(status)}</Tag>
          </div>
          <div className='muted' style={{ fontSize: 15, marginTop: 4 }}>
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
        <div className='h3' style={{ marginBottom: 12 }}>
          {t('history')}
        </div>
        <div className='stack' style={{ gap: 8 }}>
          {history.map((s) => (
            <Link
              key={s.id}
              href={`/admin/sessions/${s.id}`}
              className='row'
              style={{ gap: 12, padding: '14px 18px' }}
            >
              <div>
                <div dir='auto' style={{ fontWeight: 700, fontSize: 14 }}>
                  {s.title}
                </div>
                <div className='muted' style={{ fontSize: 12 }}>
                  <bdi>{x.coachName(s)}</bdi> · {x.when(s)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Tag kind={s.status}>{tst(s.status)}</Tag>
                <span style={{ fontWeight: 700 }}>{x.price(s.price)}</span>
              </div>
            </Link>
          ))}
          {history.length === 0 && (
            <div className='muted' style={{ fontSize: 14 }}>
              {t('noBookings')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
