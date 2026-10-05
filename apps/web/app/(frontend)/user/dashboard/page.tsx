import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { SectionHead, SessionCard, Stats } from '@/components/ui'
import { coachesOfUser, ME, sessions, sessionsOfUser, user } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'
import { isolate } from '@/i18n/locale'

export default function UserDashboard() {
  const t = useTranslations('userDashboard')
  const x = useSessionText()
  const me = user(ME.user)!
  const mine = sessionsOfUser(me.id)
  const upcoming = mine.filter(s => s.status === 'upcoming')
  const next = upcoming[0]
  const picked = sessions.filter(s => s.status === 'upcoming' && !mine.includes(s)).slice(0, 3)

  return (
    <div className='page stack' style={{ gap: 36 }}>
      <div>
        <div className='muted' style={{ fontSize: 14 }}>{t('welcome')}</div>
        <div className='title'>{t('title', { name: isolate(me.name.split(' ')[0].toUpperCase()) })}</div>
      </div>
      {next && (
        <Link href={`/user/sessions/${next.id}`} className='btn' style={{ borderRadius: 18, padding: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', textAlign: 'start', whiteSpace: 'normal' }}>
          <div>
            <div className='overline' style={{ fontSize: 13 }}>{t('nextSession')}</div>
            <div className='display' dir='auto' style={{ fontSize: 52, lineHeight: 1, marginTop: 10, letterSpacing: 0 }}>{next.title}</div>
            <div style={{ fontSize: 15, marginTop: 8, fontWeight: 400 }}><bdi>{x.coachName(next)}</bdi> · {x.when(next)}</div>
          </div>
          <div style={{ fontSize: 15 }}>{t('viewDetails')}</div>
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
