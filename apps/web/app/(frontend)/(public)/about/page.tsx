import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { br } from '@/components/rich'
import styles from './page.module.css'

const CARDS = ['members', 'coaches'] as const
const LINES = ['l1', 'l2', 'l3'] as const

export async function generateMetadata() {
  const t = await getTranslations('about')
  return { title: t('metaTitle') }
}

export default function AboutPage() {
  const t = useTranslations('about')
  return (
    <section className={`site-section ${styles.page}`}>
      <div className='eyebrow'>{t('eyebrow')}</div>
      <h1 className={`display lh-90 ${styles.title}`}>
        {t.rich('title', { br })}
      </h1>
      <p className={`muted ${styles.intro}`}>
        {t('intro')}
      </p>
      <div className={styles.cards}>
        {CARDS.map(card => (
          <div key={card} className='card'>
            <div className={`display ${styles.cardTitle}`}>{t(`cards.${card}.title`)}</div>
            <div className={`stack muted ${styles.lines}`}>
              {LINES.map(l => <div key={l}>{t(`cards.${card}.${l}`)}</div>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
