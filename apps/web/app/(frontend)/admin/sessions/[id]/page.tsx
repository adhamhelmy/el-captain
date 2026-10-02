'use client';
import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Avatar, Back, Stats, Tag, TypeTag } from '@/components/ui';
import { attendees, cap, coachName, fill, session, when } from '@/lib/mock';

export default function AdminSessionPage() {
  const s = session(useParams<{ id: string }>().id);
  const [cancelled, setCancelled] = useState(false); // Mock until wired up: DELETE /api/sessions/[id] + refunds
  if (!s) notFound();
  const status = cancelled ? 'cancelled' : s.status;
  const roster = attendees(s.id);

  return (
    <div className='page detail stack' style={{ maxWidth: 1000, gap: 28 }}>
      <Back href='/admin/sessions'>Sessions</Back>
      <div className='hero between' style={{ gap: 20 }}>
        <div>
          <div style={{ display: 'flex', gap: 8 }}>
            <TypeTag s={s} />
            <Tag kind={status}>{cap(status)}</Tag>
          </div>
          <div
            className='display'
            style={{ fontSize: 'clamp(44px, 6vw, 64px)', lineHeight: 1, marginTop: 14 }}
          >
            {s.title}
          </div>
          <div className='muted' style={{ fontSize: 16, marginTop: 8 }}>
            <Link
              href={`/admin/coaches/${s.coachId}`}
              className='plain'
              style={{ fontWeight: 600 }}
            >
              {coachName(s)}
            </Link>{' '}
            · {when(s)}
          </div>
        </div>
        {status === 'upcoming' && (
          <button type='button' className='btn-ghost danger' onClick={() => setCancelled(true)}>
            Cancel &amp; refund
          </button>
        )}
      </div>
      <Stats
        small
        items={[
          [s.type === 'private' ? '1:1' : fill(s), 'Booked'],
          [`$${s.price}`, 'Price'],
          [`$${s.price * s.booked}`, 'Gross'],
          [`${s.duration} min`, s.level],
        ]}
      />
      <div className='grid-2'>
        <div>
          <div className='h3' style={{ marginBottom: 10 }}>
            DESCRIPTION
          </div>
          <div className='muted' style={{ fontSize: 15, lineHeight: 1.7 }}>
            {s.description}
          </div>
        </div>
        <div>
          <div className='h3' style={{ marginBottom: 10 }}>
            ATTENDEES
          </div>
          <div className='stack' style={{ gap: 8 }}>
            {roster.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className='row'
                style={{
                  justifyContent: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  flexWrap: 'nowrap',
                }}
              >
                <Avatar initials={u.initials} size={32} fontSize={12} />
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                <span className='muted' style={{ fontSize: 13 }}>
                  {u.email}
                </span>
              </Link>
            ))}
            {roster.length === 0 && (
              <div className='muted' style={{ fontSize: 14 }}>
                No bookings yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
