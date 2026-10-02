'use client';
import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Avatar, Back, Stats, Tag, TypeTag } from '@/components/ui';
import { cap, coach, fill, sessionsOfCoach, when } from '@/lib/mock';

// The status button's label and the status it switches to.
const TOGGLE: Partial<Record<string, [string, string]>> = {
  active: ['Suspend', 'suspended'],
  pending: ['Reject', 'rejected'],
};

export default function AdminCoachPage() {
  const c = coach(useParams<{ id: string }>().id);
  const [status, setStatus] = useState(c?.status); // Mock until wired up: PUT /api/admin/coaches/[id]
  if (!c || !status) notFound();
  const list = sessionsOfCoach(c.id);
  const toggle = TOGGLE[status] ?? ['Reinstate', 'active'];

  return (
    <div className='page detail stack' style={{ maxWidth: 960, gap: 28 }}>
      <Back href='/admin/coaches'>Coaches</Back>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <Avatar initials={c.initials} size={80} fontSize={26} accent />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className='display' style={{ fontSize: 52, lineHeight: 1 }}>
              {c.name}
            </div>
            <Tag kind={status}>{cap(status)}</Tag>
          </div>
          <div className='muted' style={{ fontSize: 15, marginTop: 4 }}>
            {c.specialty} · {c.location} · {c.email}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {status === 'pending' && (
            <button
              type='button'
              className='btn'
              style={{ padding: '12px 18px' }}
              onClick={() => setStatus('active')}
            >
              Approve
            </button>
          )}
          <button
            type='button'
            className={toggle[1] === 'active' ? 'btn-ghost' : 'btn-ghost danger'}
            onClick={() => setStatus(toggle[1] as typeof status)}
          >
            {toggle[0]}
          </button>
        </div>
      </div>
      <Stats
        small
        items={[
          [list.length, 'Sessions listed'],
          [c.clients, 'Clients'],
          [`${c.rating} ★`, `${c.reviews} reviews`],
          [`$${c.revenue}`, 'Revenue (30d)'],
        ]}
      />
      <div>
        <div className='h3' style={{ marginBottom: 10 }}>
          BIO
        </div>
        <div className='muted' style={{ fontSize: 15, lineHeight: 1.7, maxWidth: 680 }}>
          {c.bio}
        </div>
      </div>
      <div>
        <div className='h3' style={{ marginBottom: 12 }}>
          SESSIONS
        </div>
        <div className='stack' style={{ gap: 8 }}>
          {list.map((s) => (
            <Link
              key={s.id}
              href={`/admin/sessions/${s.id}`}
              className='row'
              style={{ gap: 12, padding: '14px 18px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <TypeTag s={s} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.title}</div>
                  <div className='muted' style={{ fontSize: 12 }}>
                    {when(s)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className='muted' style={{ fontSize: 13 }}>
                  {fill(s)}
                </span>
                <Tag kind={s.status}>{cap(s.status)}</Tag>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
