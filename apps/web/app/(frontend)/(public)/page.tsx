import Link from 'next/link';
import { SessionCard } from '@/components/ui';
import { categories, sessions } from '@/lib/mock';

const STEPS = [
  [
    'Find your session',
    'Browse by discipline, coach, or time. Group classes and 1:1 sessions in one place.',
  ],
  [
    'Book in seconds',
    'See live availability, reserve your spot, and get a confirmation straight away.',
  ],
  [
    'Show up and train',
    'Track your sessions, rebook favourite coaches, and keep the streak going.',
  ],
];

export default function HomePage() {
  const featured = sessions.filter((s) => s.status === 'upcoming').slice(0, 4);
  return (
    <>
      <section
        className='site-wrap'
        style={{ paddingTop: 'clamp(48px, 9vw, 88px)', paddingBottom: 72 }}
      >
        <div className='eyebrow'>Group sessions &amp; private coaching</div>
        <h1
          className='display'
          style={{ fontSize: 'clamp(64px, 10vw, 136px)', lineHeight: 0.88, maxWidth: 900 }}
        >
          TRAIN HARDER.
          <br />
          BOOK FASTER.
        </h1>
        <p
          className='muted'
          style={{
            fontSize: 18,
            lineHeight: 1.6,
            maxWidth: 520,
            margin: '24px 0 36px',
            textWrap: 'pretty',
          }}
        >
          Find yoga, HIIT, spin, strength and 1:1 coaching near you, and lock in your spot in
          seconds.
        </p>
        <form
          action='/sessions'
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 640 }}
        >
          <input
            name='q'
            className='search'
            placeholder='Try “vinyasa” or “Rae Solano”'
            style={{ padding: '16px 18px' }}
          />
          <button type='submit' className='btn' style={{ fontSize: 15, padding: '16px 24px' }}>
            Find sessions
          </button>
        </form>
        <div className='chips' style={{ marginTop: 20 }}>
          {categories.slice(1).map((c) => (
            <Link
              key={c}
              href={`/sessions?cat=${c}`}
              className='chip'
              style={{ padding: '8px 14px' }}
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section className='site-section' style={{ paddingTop: 0 }}>
        <div className='between' style={{ marginBottom: 20 }}>
          <div className='display' style={{ fontSize: 36 }}>
            ON THIS WEEK
          </div>
          <Link href='/sessions' style={{ fontSize: 14, fontWeight: 600 }}>
            See all sessions →
          </Link>
        </div>
        <div className='grid-cards'>
          {featured.map((s) => (
            <SessionCard key={s.id} s={s} href={`/sessions/${s.id}`} />
          ))}
        </div>
      </section>

      <section
        style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
      >
        <div
          className='site-section'
          style={{
            padding: '72px 32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 40,
          }}
        >
          {STEPS.map(([title, text], i) => (
            <div key={title}>
              <div
                className='display'
                style={{ fontSize: 64, color: 'var(--accent)', lineHeight: 1, letterSpacing: 0 }}
              >
                0{i + 1}
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, margin: '10px 0 8px' }}>{title}</div>
              <div className='muted' style={{ fontSize: 15, lineHeight: 1.6 }}>
                {text}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className='site-section'>
        <div
          style={{
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            borderRadius: 20,
            padding: 'clamp(28px, 5vw, 48px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 32,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className='display' style={{ fontSize: 56, lineHeight: 0.95, letterSpacing: 0 }}>
              COACH ON EL CAPTAIN
            </div>
            <div style={{ fontSize: 16, marginTop: 12, maxWidth: 480, lineHeight: 1.5 }}>
              Publish sessions, manage your schedule, and get paid. Group classes or 1:1, your call.
            </div>
          </div>
          <Link
            href='/register?role=coach'
            style={{
              background: 'var(--on-accent)',
              color: 'var(--accent)',
              fontWeight: 700,
              fontSize: 15,
              padding: '16px 26px',
              borderRadius: 10,
            }}
          >
            Apply as a coach
          </Link>
        </div>
      </section>
    </>
  );
}
