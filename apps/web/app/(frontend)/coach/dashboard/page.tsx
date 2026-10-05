import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { isolate } from '@/i18n/locale'
import { Avatar, SectionHead, Stats } from '@/components/ui'
import { clientsOfCoach, coach, fill, ME, sessionsOfCoach } from '@/lib/mock'
import { useSessionText } from '@/lib/session-text'

export default function CoachDashboard() {
  const t = useTranslations('coachDashboard')
  const ts = useTranslations('schedule')
  const x = useSessionText()
  const me = coach(ME.coach)!
  const nextUp = sessionsOfCoach(me.id).filter(s => s.status === 'upcoming').slice(0, 3)
  const recent = clientsOfCoach(me.id).slice(0, 3)

  return (
    <div className='page stack' style={{ gap: 36 }}>
      <div className='between'>
        <div>
          <div className='muted' style={{ fontSize: 14 }}>{t('welcome')}</div>
          <div className='title'>{t('title', { name: isolate(x.name(me).split(' ')[0].toUpperCase()) })}</div>
        </div>
        <Link href='/coach/sessions/me?add=1' className='btn'>{ts('add')}</Link>
      </div>
      {/* Mock until wired up: real weekly stats from the API */}
      <Stats items={[['47', t('stats.bookings')], [x.price(46500), t('stats.revenue')], ['4.9', t('stats.rating')], ['82%', t('stats.fill')]]} />
      <div className='grid-2' style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div>
          <SectionHead title={t('comingUp')} href='/coach/sessions/me' link={t('schedule')} />
          <div className='stack' style={{ gap: 10 }}>
            {nextUp.map(s => (
              <Link key={s.id} href={`/coach/sessions/${s.id}`} className='row' style={{ flexWrap: 'nowrap' }}>
                <div>
                  <div dir='auto' style={{ fontWeight: 700, fontSize: 15 }}>{s.title}</div>
                  <div className='muted' style={{ fontSize: 13 }}>{x.when(s)}</div>
                </div>
                <span className='muted' style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{fill(s)}</span>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <SectionHead title={t('recentClients')} href='/coach/users/me' link={t('allClients')} />
          <div className='stack' style={{ gap: 10 }}>
            {recent.map(c => (
              <Link key={c.id} href={`/coach/users/${c.id}`} className='row' style={{ justifyContent: 'flex-start', gap: 12, padding: '14px 18px' }}>
                <Avatar initials={c.initials} size={36} />
                <div style={{ flex: 1 }}>
                  <div dir='auto' style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                  <div className='muted' style={{ fontSize: 12 }}>{t('withYou', { count: c.count })}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
