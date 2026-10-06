'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/ui';
import styles from './page.module.css';

export default function ContactPage() {
  const t = useTranslations('contact');
  const tc = useTranslations('common');
  const [sent, setSent] = useState(false);
  return (
    <section className={`site-section ${styles.page}`}>
      <div>
        <div className='eyebrow'>{t('eyebrow')}</div>
        <h1 className={`display lh-90 ${styles.title}`}>
          {t('title')}
        </h1>
        <p className={`muted ${styles.intro}`}>
          {t('intro')}
        </p>
        <div className={`stack ${styles.emails}`}>
          {[
            [t('emailLabel'), 'support@elcaptain.app'],
            [t('coachesLabel'), 'coaches@elcaptain.app'],
          ].map(([label, email]) => (
            <div key={label}>
              <div className='dim overline'>
                {label}
              </div>
              <a href={`mailto:${email}`} dir='ltr'>
                {email}
              </a>
            </div>
          ))}
        </div>
      </div>
      <div className='card'>
        {sent ? (
          <div className={styles.sent}>
            <div className={`display ${styles.sentTitle}`}>
              {t('sentTitle')}
            </div>
            <div className={`muted ${styles.sentText}`}>
              {t('sentText')}
            </div>
            <button
              type='button'
              className={`btn-ghost ${styles.again}`}
              onClick={() => setSent(false)}
            >
              {t('sendAnother')}
            </button>
          </div>
        ) : (
          <form
            className={`stack ${styles.form}`}
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <Field label={t('name')}>
              <input className='input' required />
            </Field>
            <Field label={tc('email')}>
              <input className='input' type='email' dir='ltr' required />
            </Field>
            <Field label={t('topic')}>
              <select className='input'>
                {(['booking', 'coaching', 'partnerships', 'other'] as const).map((topic) => (
                  <option key={topic} value={topic}>
                    {t(`topics.${topic}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('message')}>
              <textarea className={`input ${styles.message}`} rows={5} required />
            </Field>
            <button type='submit' className='btn block'>
              {t('send')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
