'use client'
import { useState } from 'react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Avatar, Back, Stats, Tag } from '@/components/ui'
import { clientsOfCoach, ME } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'

export default function ClientPage() {
  const t = useTranslations('clients')
  const tst = useTranslations('status')
  const x = useSessionText()
  const { id } = useParams<{ id: string }>()
  // Only this coach's clients are visible.
  const c = clientsOfCoach(ME.coach).find(cl => cl.id === +id)
  const [note, setNote] = useState('') // Mock until wired up: persist private notes
  if (!c) notFound()

  return (
    <div className='page detail stack' style={{ maxWidth: 960, gap: 28 }}>
      <Back href='/coach/users/me'>{t('back')}</Back>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <Avatar initials={c.initials} size={80} fontSize={26} accent />
        <div>
          <div className='display' dir='auto' style={{ fontSize: 52, lineHeight: 1 }}>{c.name}</div>
          <div className='muted' style={{ fontSize: 15, marginTop: 4 }}><bdi>{c.email}</bdi> · <bdi>{c.phone}</bdi></div>
        </div>
      </div>
      <Stats small items={[[c.count, t('withYou')], [c.last ? x.dayMonth(c.last) : '—', t('lastVisit')], [x.monthYear(c.joined), t('memberSince')]]} />
      <div className='grid-2'>
        <div>
          <div className='h3' style={{ marginBottom: 12 }}>{t('history')}</div>
          <div className='stack' style={{ gap: 8 }}>
            {c.history.map(s => (
              <Link key={s.id} href={`/coach/sessions/${s.id}`} className='row' style={{ padding: '14px 16px', gap: 12, flexWrap: 'nowrap' }}>
                <div>
                  <div dir='auto' style={{ fontWeight: 700, fontSize: 14 }}>{s.title}</div>
                  <div className='muted' style={{ fontSize: 12 }}>{x.when(s)}</div>
                </div>
                <Tag kind={s.status}>{tst(s.status)}</Tag>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className='h3' style={{ marginBottom: 12 }}>{t('notes')}</div>
          <textarea
            rows={6}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t('notesPlaceholder')}
            className='input'
            style={{ background: 'var(--surface)', padding: '14px 16px', borderRadius: 12, lineHeight: 1.6, resize: 'vertical' }}
          />
        </div>
      </div>
    </div>
  )
}
