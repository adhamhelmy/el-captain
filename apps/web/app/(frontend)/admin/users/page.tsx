'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Person, Table, Tag } from '@/components/ui'
import { sessionsOfUser, userSpent, users } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'

export default function AdminUsersPage() {
  const t = useTranslations('admin')
  const tst = useTranslations('status')
  const x = useSessionText()
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = users.filter(u => !needle || `${u.name} ${u.email}`.toLowerCase().includes(needle))

  return (
    <div className='page'>
      <div className='between' style={{ marginBottom: 24 }}>
        <div className='title'>{t('users')}</div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('search')} className='search' style={{ flex: 'none', width: 300, maxWidth: '100%', minWidth: 0, fontSize: 14, padding: '12px 16px' }} />
      </div>
      <Table cols='minmax(0,2.2fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,0.8fr) minmax(0,1fr)' head={[t('head.user'), t('head.joined'), t('head.bookings'), t('head.spent'), t('head.status')]}>
        {list.map(u => (
          <Link key={u.id} href={`/admin/users/${u.id}`} className='tr'>
            <Person initials={u.initials} name={u.name} sub={u.email} />
            <span className='muted'>{x.monthYear(u.joined)}</span>
            <span className='muted'>{sessionsOfUser(u.id).length}</span>
            <span className='muted'>{x.price(userSpent(u.id))}</span>
            <span><Tag kind={u.status}>{tst(u.status)}</Tag></span>
          </Link>
        ))}
        {list.length === 0 && <div className='empty' style={{ padding: 48 }}>{t('noUsers')}</div>}
      </Table>
    </div>
  )
}
