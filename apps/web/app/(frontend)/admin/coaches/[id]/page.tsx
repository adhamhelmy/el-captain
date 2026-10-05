'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { notFound, useParams } from 'next/navigation';
import { Avatar, Back, Stats, Tag, TypeTag } from '@/components/ui';
import { coach, fill, sessionsOfCoach } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';

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
    <div className='page detail stack' style={{ maxWidth: 960, gap: 28 }}>
      <Back href='/admin/coaches'>{t('backCoaches')}</Back>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <Avatar initials={x.initials(c)} size={80} fontSize={26} accent />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className='display' dir='auto' style={{ fontSize: 52, lineHeight: 1 }}>
              {x.name(c)}
            </div>
            <Tag kind={status}>{tst(status)}</Tag>
          </div>
          <div className='muted' style={{ fontSize: 15, marginTop: 4 }}>
            {x.category(c.specialty)} · <bdi>{c.location}</bdi> · <bdi>{c.email}</bdi>
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
        <div className='h3' style={{ marginBottom: 10 }}>
          {t('bio')}
        </div>
        <div className='muted' dir='auto' style={{ fontSize: 15, lineHeight: 1.7, maxWidth: 680 }}>
          {c.bio}
        </div>
      </div>
      <div>
        <div className='h3' style={{ marginBottom: 12 }}>
          {t('sessions')}
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
                  <div dir='auto' style={{ fontWeight: 700, fontSize: 14 }}>
                    {s.title}
                  </div>
                  <div className='muted' style={{ fontSize: 12 }}>
                    {x.when(s)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className='muted' style={{ fontSize: 13 }}>
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
