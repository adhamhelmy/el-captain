import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { br } from '@/components/rich'

const CARDS = ['members', 'coaches'] as const
const LINES = ['l1', 'l2', 'l3'] as const

export async function generateMetadata() {
  const t = await getTranslations('about')
  return { title: t('metaTitle') }
}

export default function AboutPage() {
  const t = useTranslations('about')
  return (
    <section className='site-section' style={{ maxWidth: 960 }}>
      <div className='eyebrow'>{t('eyebrow')}</div>
      <h1 className='display lh-90' style={{ fontSize: 'clamp(56px, 8vw, 96px)', letterSpacing: 0 }}>
        {t.rich('title', { br })}
      </h1>
      <p className='muted' style={{ fontSize: 18, lineHeight: 1.7, margin: '28px 0 56px', maxWidth: 640, textWrap: 'pretty' }}>
        {t('intro')}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {CARDS.map(card => (
          <div key={card} className='card'>
            <div className='display' style={{ fontSize: 28, marginBottom: 16 }}>{t(`cards.${card}.title`)}</div>
            <div className='stack muted' style={{ gap: 12, fontSize: 15, lineHeight: 1.5 }}>
              {LINES.map(l => <div key={l}>{t(`cards.${card}.${l}`)}</div>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
