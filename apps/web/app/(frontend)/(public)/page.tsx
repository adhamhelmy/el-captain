import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { HomeFeatured, HomeSports } from './HomeSessions';
import styles from './page.module.css';

const STEPS = ['find', 'book', 'train'] as const;

export default function HomePage() {
  const t = useTranslations('home');
  return (
    <>
      <section className={`site-wrap ${styles.hero}`}>
        <div className='eyebrow'>{t('eyebrow')}</div>
        <h2 className='display lh-88 hero-title'>{t('heroTitle')}</h2>
        <p className={`muted ${styles.heroText}`}>{t('heroText')}</p>
        <form action='/sessions' className={styles.search}>
          <input name='q' className={`search ${styles.searchInput}`} placeholder={t('searchPlaceholder')} />
          <button type='submit' className={`btn ${styles.searchBtn}`}>
            {t('findSessions')}
          </button>
        </form>
        <HomeSports />
      </section>

      <section className={`site-section ${styles.featured}`}>
        <div className={`between ${styles.featuredHead}`}>
          <div className={`display ${styles.featuredTitle}`}>{t('onThisWeek')}</div>
          <Link href='/sessions' className={styles.seeAll}>
            {t('seeAll')}
          </Link>
        </div>
        <HomeFeatured />
      </section>

      <section className={styles.stepsBand}>
        <div className={`site-section ${styles.steps}`}>
          {STEPS.map((step, i) => (
            <div key={step}>
              <div className={`display ${styles.stepNumber}`}>0{i + 1}</div>
              <div className={styles.stepTitle}>{t(`steps.${step}.title`)}</div>
              <div className={`muted ${styles.stepText}`}>{t(`steps.${step}.text`)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className='site-section'>
        <div className={styles.coachBanner}>
          <div>
            <div className={`display lh-95 ${styles.coachTitle}`}>{t('coachTitle')}</div>
            <div className={styles.coachText}>{t('coachText')}</div>
          </div>
          <Link href='/register?role=coach' className={styles.applyCoach}>
            {t('applyCoach')}
          </Link>
        </div>
      </section>
    </>
  );
}
