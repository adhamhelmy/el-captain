import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { SectionHead, SessionCard, Stats } from '@/components/ui'
import { coachesOfUser, ME, sessions, sessionsOfUser, user } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'
import { isolate } from '@/i18n/locale'
import styles from './page.module.css'

export default function UserDashboard() {
  const t = useTranslations('userDashboard')
  const x = useSessionText()
  const me = user(ME.user)!
  const mine = sessionsOfUser(me.id)
  const upcoming = mine.filter(s => s.status === 'upcoming')
  const next = upcoming[0]
  const picked = sessions.filter(s => s.status === 'upcoming' && !mine.includes(s)).slice(0, 3)

  return (
    <div className={`page stack ${styles.page}`}>
      <div>
        <div className={`muted ${styles.welcome}`}>{t('welcome')}</div>
        <div className='title'>{t('title', { name: isolate(me.name.split(' ')[0].toUpperCase()) })}</div>
      </div>
      {next && (
        <Link href={`/user/sessions/${next.id}`} className={`btn ${styles.next}`}>
          <div>
            <div className={`overline ${styles.nextLabel}`}>{t('nextSession')}</div>
            <div className={`display ${styles.nextTitle}`} dir='auto'>{next.title}</div>
            <div className={styles.nextWhen}><bdi>{x.coachName(next)}</bdi> · {x.when(next)}</div>
          </div>
          <div className={styles.viewDetails}>{t('viewDetails')}</div>
        </Link>
      )}
      <Stats items={[
        [upcoming.length, t('stats.upcoming')],
        [mine.length - upcoming.length, t('stats.completed')],
        [coachesOfUser(me.id).length, t('stats.coaches')],
      ]} />
      <div>
        <SectionHead title={t('picked')} href='/user/sessions' link={t('browseAll')} />
        <div className='grid-cards'>
          {picked.map(s => <SessionCard key={s.id} s={s} href={`/user/sessions/${s.id}`} />)}
        </div>
      </div>
    </div>
  )
}
