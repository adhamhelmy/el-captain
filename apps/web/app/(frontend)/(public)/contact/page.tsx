import { getTranslations } from 'next-intl/server';
import styles from './page.module.css';

export default async function ContactPage() {
  const t = await getTranslations('contact');
  return (
    <section className={`site-section ${styles.page}`}>
      <div>
        <div className='eyebrow'>{t('eyebrow')}</div>
        <h1 className={`display lh-90 ${styles.title}`}>{t('title')}</h1>
        <p className={`muted ${styles.intro}`}>{t('intro')}</p>
        <div className={`stack ${styles.emails}`}>
          {[
            [t('emailLabel'), 'support@el-captain.app'],
            [t('coachesLabel'), 'coaches@el-captain.app'],
          ].map(([label, email]) => (
            <div key={label}>
              <div className='dim overline'>{label}</div>
              <a href={`mailto:${email}`} dir='ltr'>
                {email}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
