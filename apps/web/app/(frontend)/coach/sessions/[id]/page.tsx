'use client';
import { useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Avatar, Back, Stats, Tag, TypeTag } from '@/components/ui';
import { attendees, cap, coachName, fill, ME, session, when } from '@/lib/mock';

export default function CoachSessionPage() {
  const s = session(useParams<{ id: string }>().id);
  const [cancelled, setCancelled] = useState(false);
  if (!s) notFound();
  const own = s.coachId === ME.coach;
  const status = cancelled ? 'cancelled' : s.status;
  const roster = own ? attendees(s.id) : [];

  return (
    <div className='page detail' style={{ maxWidth: 1080 }}>
      <Back href={own ? '/coach/sessions/me' : '/coach/sessions'}>Back</Back>
      <div className='hero between' style={{ marginTop: 20, gap: 20 }}>
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
            {coachName(s)} · {when(s)}
          </div>
        </div>
        {own && status === 'upcoming' && (
          <button type='button' className='btn-ghost danger' onClick={() => setCancelled(true)}>
            Cancel session
          </button>
        )}
      </div>
      <div style={{ marginTop: 24 }}>
        <Stats
          small
          items={[
            [s.type === 'private' ? '1:1' : fill(s), 'Booked'],
            [`$${s.price}`, 'Price'],
            [`${s.duration} min`, 'Duration'],
            own ? [`$${s.price * s.booked}`, 'Earnings'] : [s.level, 'Level'],
          ]}
        />
      </div>
      <div className='grid-2' style={{ gap: 32, marginTop: 32 }}>
        <div>
          <div className='h3' style={{ marginBottom: 10 }}>
            DESCRIPTION
          </div>
          <div className='muted' style={{ fontSize: 15, lineHeight: 1.7 }}>
            {s.description}
          </div>
        </div>
        {own ? (
          <div>
            <div className='h3' style={{ marginBottom: 10 }}>
              ROSTER
            </div>
            <div className='stack' style={{ gap: 8 }}>
              {roster.map((u) => (
                <Link
                  key={u.id}
                  href={`/coach/users/${u.id}`}
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
        ) : (
          <div
            className='card muted'
            style={{ padding: 20, borderRadius: 14, fontSize: 14, lineHeight: 1.6 }}
          >
            This session belongs to another coach. Roster and earnings are only visible to them.
          </div>
        )}
      </div>
    </div>
  );
}
