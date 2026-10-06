'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Person, Segmented, Table, Tag } from '@/components/ui'
import { coaches, type CoachStatus } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'
import { isolate } from '@/i18n/locale'
import styles from './page.module.css'

export default function AdminCoachesPage() {
  const t = useTranslations('admin')
  const tst = useTranslations('status')
  const x = useSessionText()
  const [filter, setFilter] = useState<'all' | CoachStatus>('all')
  const list = coaches.filter(c => filter === 'all' || c.status === filter)

  return (
    <div className='page'>
      <div className={`between ${styles.head}`}>
        <div className='title'>{t('coaches')}</div>
        <Segmented options={[[x.category('all'), 'all'], [tst('active'), 'active'], [tst('pending'), 'pending'], [tst('suspended'), 'suspended']]} value={filter} onChange={setFilter} />
      </div>
      <Table className={styles.cols} head={[t('head.coach'), t('head.rating'), t('head.clients'), t('head.revenue'), t('head.status')]}>
        {list.map(c => (
          <Link key={c.id} href={`/admin/coaches/${c.id}`} className='tr'>
            <Person initials={x.initials(c)} name={x.name(c)} sub={`${x.category(c.specialty)} · ${isolate(c.location)}`} />
            <span className='muted'>{c.rating} ★</span>
            <span className='muted'>{c.clients}</span>
            <span className='muted'>{x.price(c.revenue)}</span>
            <span><Tag kind={c.status}>{tst(c.status)}</Tag></span>
          </Link>
        ))}
      </Table>
    </div>
  )
}
