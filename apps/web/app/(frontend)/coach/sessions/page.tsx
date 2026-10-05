'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Chips, SessionCard, Tag } from '@/components/ui'
import { CATEGORIES, ME, sessions, type Category } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'

export default function AllSessionsPage() {
  const t = useTranslations('coachSessions')
  const tst = useTranslations('status')
  const x = useSessionText()
  const [cat, setCat] = useState<Category | 'all'>('all')
  const list = sessions.filter(s => s.status === 'upcoming' && (cat === 'all' || s.category === cat))

  return (
    <div className='page'>
      <div className='title'>{t('title')}</div>
      <div className='sub' style={{ marginBottom: 24 }}>{t('sub')}</div>
      <div style={{ marginBottom: 24 }}>
        <Chips
          options={(['all', ...CATEGORIES] as const).map((c) => [x.category(c), c])}
          value={cat}
          onChange={setCat}
        />
      </div>
      <div className='grid-cards'>
        {list.map(s => (
          <SessionCard key={s.id} s={s} href={`/coach/sessions/${s.id}`} spots badge={s.coachId === ME.coach ? <Tag kind='mine'>{tst('mine')}</Tag> : undefined} />
        ))}
      </div>
    </div>
  )
}
