'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { browseLink } from '@/components/rich'
import { Segmented, TypeTag } from '@/components/ui'
import { ME, sessionsOfUser } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'
import styles from './page.module.css'

export default function MySessionsPage() {
  const t = useTranslations('userSessions')
  const x = useSessionText()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const list = sessionsOfUser(ME.user).filter(s => s.status === tab)

  return (
    <div className={`page ${styles.page}`}>
      <div className={`title ${styles.title}`}>{t('title')}</div>
      <div className={styles.tabs}>
        <Segmented options={[[t('upcoming'), 'upcoming'], [t('past'), 'past']]} value={tab} onChange={setTab} />
      </div>
      <div className={`stack ${styles.list}`}>
        {list.map(s => (
          <div key={s.id} className='row'>
            <Link href={`/user/sessions/${s.id}`} className={`plain ${styles.session}`}>
              <TypeTag s={s} />
              <div>
                <div dir='auto' className={styles.sessionTitle}>{s.title}</div>
                <div className={`muted ${styles.when}`}><bdi>{x.coachName(s)}</bdi> · {x.when(s)}</div>
              </div>
            </Link>
            <div className={styles.meta}>
              <span className={`display ${styles.price}`}>{x.price(s.price)}</span>
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
