'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './page.module.css';

const FAQS = ['book', 'cancel', 'types', 'becomeCoach', 'payouts', 'fee'] as const;

export default function FaqPage() {
  const t = useTranslations('faq');
  const [open, setOpen] = useState(0);
  return (
    <section className={`site-section ${styles.page}`}>
      <div className='eyebrow'>{t('eyebrow')}</div>
      <h1 className={`display lh-90 ${styles.title}`}>{t('title')}</h1>
      <div className={`stack ${styles.list}`}>
        {FAQS.map((item, i) => (
          <div key={item} className={`card ${styles.item}`}>
            <button
              type='button'
              className={styles.question}
              onClick={() => setOpen(open === i ? -1 : i)}
            >
              <span>{t(`items.${item}.q`)}</span>
              <span className={styles.sign}>{open === i ? '–' : '+'}</span>
            </button>
            {open === i && (
              <div className={`muted ${styles.answer}`}>
                {t(`items.${item}.a`)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
