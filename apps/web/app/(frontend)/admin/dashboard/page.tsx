'use client';
import { useState } from 'react';
import Link from 'next/link';
import { SectionHead, Stats } from '@/components/ui';
import { bookings, coaches, session, user, type CoachStatus } from '@/lib/mock';

export default function AdminDashboard() {
  const [status, setStatus] = useState<Record<number, CoachStatus>>({}); // Mock until wired up: PUT /api/admin/coaches/[id]
  const statusOf = (id: number) => status[id] ?? coaches.find((c) => c.id === id)!.status;
  const pending = coaches.filter((c) => statusOf(c.id) === 'pending');
  const recent = bookings.filter((b) => b.ago);

  return (
    <div className='page stack' style={{ gap: 36 }}>
      <div>
        <div className='muted' style={{ fontSize: 14 }}>
          Platform overview
        </div>
        <div className='title'>DASHBOARD</div>
      </div>
      {/* Mock until wired up: real platform stats from GET /api/admin/dashboard */}
      <Stats
        items={[
          ['1,284', 'Total users'],
          [coaches.filter((c) => statusOf(c.id) === 'active').length + 33, 'Active coaches'],
          ['212', 'Sessions this week'],
          ['$61,300', 'Gross bookings (30d)'],
        ]}
      />
      <div
        className='grid-2'
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))' }}
      >
        <div>
          <SectionHead title='PENDING COACHES' href='/admin/coaches' link='All coaches →' />
          <div className='stack' style={{ gap: 10 }}>
            {pending.map((c) => (
              <div key={c.id} className='row' style={{ gap: 12, padding: '14px 18px' }}>
                <Link href={`/admin/coaches/${c.id}`} className='plain'>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                  <div className='muted' style={{ fontSize: 13 }}>
                    {c.specialty} · applied {c.joined}
                  </div>
                </Link>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type='button'
                    className='btn'
                    style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13 }}
                    onClick={() => setStatus({ ...status, [c.id]: 'active' })}
                  >
                    Approve
                  </button>
                  <button
                    type='button'
                    className='btn-ghost sm'
                    style={{ color: 'var(--text-2)', fontWeight: 400 }}
                    onClick={() => setStatus({ ...status, [c.id]: 'rejected' })}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <div className='muted' style={{ fontSize: 14, padding: '16px 0' }}>
                No applications waiting.
              </div>
            )}
          </div>
        </div>
        <div>
          <div className='h2' style={{ marginBottom: 14 }}>
            RECENT BOOKINGS
          </div>
          <div className='card' style={{ padding: 0, borderRadius: 14 }}>
            {recent.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 14,
                }}
              >
                <div>
                  <Link
                    href={`/admin/users/${b.userId}`}
                    className='plain'
                    style={{ fontWeight: 600 }}
                  >
                    {user(b.userId)!.name}
                  </Link>
                  <span className='muted'> booked </span>
                  <Link
                    href={`/admin/sessions/${b.sessionId}`}
                    className='plain'
                    style={{ fontWeight: 600 }}
                  >
                    {session(b.sessionId)!.title}
                  </Link>
                </div>
                <span className='dim' style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                  {b.ago}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
