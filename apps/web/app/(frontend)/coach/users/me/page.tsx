import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Person, Table } from '@/components/ui'
import { clientsOfCoach, ME } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'
import styles from './page.module.css'

export default function MyClientsPage() {
  const t = useTranslations('clients')
  const x = useSessionText()
  return (
    <div className={`page ${styles.page}`}>
      <div className='title'>{t('title')}</div>
      <div className={`sub ${styles.sub}`}>{t('sub')}</div>
      <Table className={styles.cols} head={[t('client'), t('sessions'), t('lastVisit')]}>
        {clientsOfCoach(ME.coach).map(c => (
          <Link key={c.id} href={`/coach/users/${c.id}`} className='tr'>
            <Person initials={c.initials} name={c.name} sub={c.email} />
            <span className='muted'>{c.count}</span>
            <span className='muted'>{c.last ? x.dayMonth(c.last) : '—'}</span>
          </Link>
        ))}
      </Table>
    </div>
  )
}
