import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SessionCard } from '@/components/ui';
import { CATEGORIES, sessions } from '@/lib/mock';
import { useSessionText } from '@/lib/session-text';

const STEPS = ['find', 'book', 'train'] as const;

export default function HomePage() {
  const t = useTranslations('home');
  const x = useSessionText();
  const featured = sessions.filter((s) => s.status === 'upcoming').slice(0, 4);
  return (
    <>
      <section
        className='site-wrap'
        style={{ paddingTop: 'clamp(48px, 9vw, 88px)', paddingBottom: 72 }}
      >
        <div className='eyebrow'>{t('eyebrow')}</div>
        <h2
          className='display lh-88 hero-title'
        >
          {t('heroTitle')}
        </h2>
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
          {t('heroText')}
        </p>
        <form
          action='/sessions'
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 640 }}
        >
          <input
            name='q'
            className='search'
            placeholder={t('searchPlaceholder')}
            style={{ padding: '16px 18px' }}
          />
          <button type='submit' className='btn' style={{ fontSize: 15, padding: '16px 24px' }}>
            {t('findSessions')}
          </button>
        </form>
        <div className='chips' style={{ marginTop: 20 }}>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/sessions?cat=${c}`}
              className='chip'
              style={{ padding: '8px 14px' }}
            >
              {x.category(c)}
            </Link>
          ))}
        </div>
      </section>

      <section className='site-section' style={{ paddingTop: 0 }}>
        <div className='between' style={{ marginBottom: 20 }}>
          <div className='display' style={{ fontSize: 36 }}>
            {t('onThisWeek')}
          </div>
          <Link href='/sessions' style={{ fontSize: 14, fontWeight: 600 }}>
            {t('seeAll')}
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
          {STEPS.map((step, i) => (
            <div key={step}>
              <div
                className='display'
                style={{
                  fontSize: 64,
                  color: 'var(--accent-text)',
                  lineHeight: 1,
                  letterSpacing: 0,
                }}
              >
                0{i + 1}
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, margin: '10px 0 8px' }}>{t(`steps.${step}.title`)}</div>
              <div className='muted' style={{ fontSize: 15, lineHeight: 1.6 }}>
                {t(`steps.${step}.text`)}
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
            <div className='display lh-95' style={{ fontSize: 56, letterSpacing: 0 }}>
              {t('coachTitle')}
            </div>
            <div style={{ fontSize: 16, marginTop: 12, maxWidth: 480, lineHeight: 1.5 }}>
              {t('coachText')}
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
            {t('applyCoach')}
          </Link>
        </div>
      </section>
    </>
  );
}
