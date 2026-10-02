import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar, Back, TypeTag } from '@/components/ui';
import { coach, sessionsOfCoach, spotsLabel, when } from '@/lib/mock';

/** Coach profile; `area` prefixes links ('' for guests, '/user' for members). Only active coaches are shown. */
export function CoachProfile({ id, area }: Readonly<{ id: string; area: '' | '/user' }>) {
  const c = coach(id);
  if (c?.status !== 'active') notFound();
  const upcoming = sessionsOfCoach(c.id).filter((s) => s.status === 'upcoming');
  const privateSession = upcoming.find((s) => s.type === 'private');

  return (
    <div className='page detail stack' style={{ maxWidth: 1000, gap: 32 }}>
      {area ? (
        <Back href='/user/coaches'>All coaches</Back>
      ) : (
        <Back href='/sessions'>All sessions</Back>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <Avatar initials={c.initials} size={96} fontSize={32} accent />
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className='display' style={{ fontSize: 56, lineHeight: 1 }}>
            {c.name}
          </div>
          <div className='muted' style={{ fontSize: 15, marginTop: 6 }}>
            {c.specialty} coach · {c.location} · {c.rating} ★ ({c.reviews} reviews)
          </div>
        </div>
        {privateSession && (
          <Link
            href={`${area}/sessions/${privateSession.id}`}
            className='btn'
            style={{ fontSize: 15, padding: '14px 22px' }}
          >
            Book 1:1 · ${c.rate}
          </Link>
        )}
      </div>
      <div className='muted' style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 680 }}>
        {c.bio}
      </div>
      <div>
        <div className='h2' style={{ marginBottom: 14 }}>
          UPCOMING SESSIONS
        </div>
        <div className='stack' style={{ gap: 10 }}>
          {upcoming.map((s) => (
            <Link key={s.id} href={`${area}/sessions/${s.id}`} className='row'>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <TypeTag s={s} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.title}</div>
                  <div className='muted' style={{ fontSize: 13 }}>
                    {when(s)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span className='muted' style={{ fontSize: 14 }}>
                  {spotsLabel(s)}
                </span>
                <span className='display' style={{ fontSize: 22, letterSpacing: 0 }}>
                  ${s.price}
                </span>
              </div>
            </Link>
          ))}
          {upcoming.length === 0 && (
            <div className='muted' style={{ fontSize: 14 }}>
              No upcoming sessions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
