import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Avatar, Back, TypeTag } from '@/components/ui';
import { isolate } from '@/i18n/locale';
import { coach, sessionsOfCoach } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';

/** Coach profile; `area` prefixes links ('' for guests, '/user' for members). Only active coaches are shown. */
export function CoachProfile({ id, area }: Readonly<{ id: string; area: '' | '/user' }>) {
  const t = useTranslations('coachProfile');
  const tu = useTranslations('ui');
  const x = useSessionText();
  const c = coach(id);
  if (c?.status !== 'active') notFound();
  const upcoming = sessionsOfCoach(c.id).filter((s) => s.status === 'upcoming');
  const privateSession = upcoming.find((s) => s.type === 'private');

  return (
    <div className='page detail stack' style={{ maxWidth: 1000, gap: 32 }}>
      {area ? (
        <Back href='/user/coaches'>{t('allCoaches')}</Back>
      ) : (
        <Back href='/sessions'>{t('allSessions')}</Back>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <Avatar initials={x.initials(c)} size={96} fontSize={32} accent />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className='display' dir='auto' style={{ fontSize: 56, lineHeight: 1 }}>
            {x.name(c)}
          </div>
          <div className='muted' style={{ fontSize: 15, marginTop: 6 }}>
            {t('line', {
              specialty: x.category(c.specialty),
              location: isolate(c.location),
              rating: c.rating,
              reviews: tu('reviews', { count: c.reviews }),
            })}
          </div>
        </div>
        {privateSession && (
          <Link
            href={`${area}/sessions/${privateSession.id}`}
            className='btn'
            style={{ fontSize: 15, padding: '14px 22px' }}
          >
            {t('bookPrivate', { price: x.price(c.rate) })}
          </Link>
        )}
      </div>
      <div className='muted' dir='auto' style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 680 }}>
        {c.bio}
      </div>
      <div>
        <div className='h2' style={{ marginBottom: 14 }}>
          {t('upcoming')}
        </div>
        <div className='stack' style={{ gap: 10 }}>
          {upcoming.map((s) => (
            <Link key={s.id} href={`${area}/sessions/${s.id}`} className='row'>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <TypeTag s={s} />
                <div>
                  <div dir='auto' style={{ fontWeight: 700, fontSize: 15 }}>
                    {s.title}
                  </div>
                  <div className='muted' style={{ fontSize: 13 }}>
                    {x.when(s)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span className='muted' style={{ fontSize: 14 }}>
                  {x.spots(s)}
                </span>
                <span className='display' style={{ fontSize: 22, letterSpacing: 0 }}>
                  {x.price(s.price)}
                </span>
              </div>
            </Link>
          ))}
          {upcoming.length === 0 && (
            <div className='muted' style={{ fontSize: 14 }}>
              {t('none')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
