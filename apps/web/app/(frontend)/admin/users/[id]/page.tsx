'use client';
import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Avatar, Back, Stats, Tag } from '@/components/ui';
import { cap, coachName, sessionsOfUser, user, userSpent, when } from '@/lib/mock';

export default function AdminUserPage() {
  const u = user(useParams<{ id: string }>().id);
  const [status, setStatus] = useState(u?.status); // Mock until wired up: PUT /api/admin/users/[id]
  if (!u || !status) notFound();
  const history = sessionsOfUser(u.id);
  const active = status === 'active';

  return (
    <div className='page detail stack' style={{ maxWidth: 960, gap: 28 }}>
      <Back href='/admin/users'>Users</Back>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <Avatar initials={u.initials} size={80} fontSize={26} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className='display' style={{ fontSize: 52, lineHeight: 1 }}>
              {u.name}
            </div>
            <Tag kind={status}>{cap(status)}</Tag>
          </div>
          <div className='muted' style={{ fontSize: 15, marginTop: 4 }}>
            {u.email} · {u.phone}
          </div>
        </div>
        <button
          type='button'
          className={active ? 'btn-ghost danger' : 'btn-ghost'}
          onClick={() => setStatus(active ? 'suspended' : 'active')}
        >
          {active ? 'Suspend user' : 'Reactivate'}
        </button>
      </div>
      <Stats
        small
        items={[
          [history.length, 'Bookings'],
          [`$${userSpent(u.id)}`, 'Total spent'],
          [u.joined, 'Joined'],
          [u.lastActive, 'Last active'],
        ]}
      />
      <div>
        <div className='h3' style={{ marginBottom: 12 }}>
          BOOKING HISTORY
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
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.title}</div>
                <div className='muted' style={{ fontSize: 12 }}>
                  {coachName(s)} · {when(s)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Tag kind={s.status}>{cap(s.status)}</Tag>
                <span style={{ fontWeight: 700 }}>${s.price}</span>
              </div>
            </Link>
          ))}
          {history.length === 0 && (
            <div className='muted' style={{ fontSize: 14 }}>
              No bookings yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
