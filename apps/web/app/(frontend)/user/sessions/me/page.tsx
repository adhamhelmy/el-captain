'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { browseLink } from '@/components/rich'
import { Segmented, TypeTag } from '@/components/ui'
import { ME, sessionsOfUser } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'

export default function MySessionsPage() {
  const t = useTranslations('userSessions')
  const x = useSessionText()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const list = sessionsOfUser(ME.user).filter(s => s.status === tab)

  return (
    <div className='page' style={{ maxWidth: 960 }}>
      <div className='title' style={{ marginBottom: 24 }}>{t('title')}</div>
      <div style={{ marginBottom: 24 }}>
        <Segmented options={[[t('upcoming'), 'upcoming'], [t('past'), 'past']]} value={tab} onChange={setTab} />
      </div>
      <div className='stack' style={{ gap: 10 }}>
        {list.map(s => (
          <div key={s.id} className='row'>
            <Link href={`/user/sessions/${s.id}`} className='plain' style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <TypeTag s={s} />
              <div>
                <div dir='auto' style={{ fontWeight: 700, fontSize: 15 }}>{s.title}</div>
                <div className='muted' style={{ fontSize: 13 }}><bdi>{x.coachName(s)}</bdi> · {x.when(s)}</div>
              </div>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className='display' style={{ fontSize: 22, letterSpacing: 0 }}>{x.price(s.price)}</span>
              {tab === 'upcoming'
                ? <Link href={`/user/sessions/${s.id}`} className='btn-ghost sm plain'>{t('details')}</Link>
                : <Link href={`/user/coaches/${s.coachId}`} className='btn-ghost sm plain'>{t('bookAgain')}</Link>}
            </div>
          </div>
        ))}
        {list.length === 0 && <div className='empty'>{t.rich('empty', { link: browseLink })}</div>}
      </div>
    </div>
  )
}
