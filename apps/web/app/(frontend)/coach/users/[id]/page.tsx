'use client'
import { useState } from 'react'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Avatar, Back, Stats, Tag } from '@/components/ui'
import { clientsOfCoach, ME } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'
import detail from '../../../detail.module.css'
import styles from './page.module.css'

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
    <div className={`page detail stack ${detail.page}`}>
      <Back href='/coach/users/me'>{t('back')}</Back>
      <div className={detail.profile}>
        <Avatar initials={c.initials} size={80} accent />
        <div>
          <div className={`display ${detail.name}`} dir='auto'>{c.name}</div>
          <div className={`muted ${detail.line}`}><bdi>{c.email}</bdi> · <bdi>{c.phone}</bdi></div>
        </div>
      </div>
      <Stats small items={[[c.count, t('withYou')], [c.last ? x.dayMonth(c.last) : '—', t('lastVisit')], [x.monthYear(c.joined), t('memberSince')]]} />
      <div className='grid-2'>
        <div>
          <div className={`h3 ${detail.heading}`}>{t('history')}</div>
          <div className={`stack ${detail.list}`}>
            {c.history.map(s => (
              <Link key={s.id} href={`/coach/sessions/${s.id}`} className={`row ${detail.row} ${styles.visit}`}>
                <div>
                  <div dir='auto' className={detail.rowTitle}>{s.title}</div>
                  <div className={`muted ${detail.rowSub}`}>{x.when(s)}</div>
                </div>
                <Tag kind={s.status}>{tst(s.status)}</Tag>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className={`h3 ${detail.heading}`}>{t('notes')}</div>
          <textarea
            rows={6}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t('notesPlaceholder')}
            className={`input ${styles.notes}`}
          />
        </div>
      </div>
    </div>
  )
}
