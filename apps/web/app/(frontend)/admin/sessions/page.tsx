'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Segmented, Table, Tag } from '@/components/ui'
import { fill, sessions } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'
import styles from './page.module.css'

export default function AdminSessionsPage() {
  const t = useTranslations('admin')
  const tst = useTranslations('status')
  const x = useSessionText()
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const list = sessions.filter(s => filter === 'all' || s.status === filter)

  return (
    <div className='page'>
      <div className={`between ${styles.head}`}>
        <div className='title'>{t('sessions')}</div>
        <Segmented options={[[tst('upcoming'), 'upcoming'], [tst('past'), 'past'], [x.category('all'), 'all']]} value={filter} onChange={setFilter} />
      </div>
      <Table className={styles.cols} head={[t('head.session'), t('head.coach'), t('head.when'), t('head.booked'), t('head.price'), t('head.status')]}>
        {list.map(s => (
          <Link key={s.id} href={`/admin/sessions/${s.id}`} className='tr'>
            <span>
              <bdi className={styles.title}>{s.title}</bdi>
              <span className='cell-sub'>{x.category(s.category)} · {x.type(s.type)}</span>
            </span>
            <bdi className='muted'>{x.coachName(s)}</bdi>
            <span className='muted'>{x.when(s)}</span>
            <span className='muted'>{fill(s)}</span>
            <span className={styles.price}>{x.price(s.price)}</span>
            <span><Tag kind={s.status}>{tst(s.status)}</Tag></span>
          </Link>
        ))}
      </Table>
    </div>
  )
}
