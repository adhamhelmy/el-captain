'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Field } from '@/components/ui';

export default function ContactPage() {
  const t = useTranslations('contact');
  const tc = useTranslations('common');
  const [sent, setSent] = useState(false);
  return (
    <section
      className='site-section'
      style={{
        maxWidth: 1000,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 48,
        alignItems: 'start',
      }}
    >
      <div>
        <div className='eyebrow'>{t('eyebrow')}</div>
        <h1 className='display lh-90' style={{ fontSize: 72, letterSpacing: 0 }}>
          {t('title')}
        </h1>
        <p className='muted' style={{ fontSize: 16, lineHeight: 1.7, margin: '20px 0 32px' }}>
          {t('intro')}
        </p>
        <div className='stack' style={{ gap: 14, fontSize: 15 }}>
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
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div className='display' style={{ fontSize: 36 }}>
              {t('sentTitle')}
            </div>
            <div className='muted' style={{ fontSize: 15, marginTop: 8 }}>
              {t('sentText')}
            </div>
            <button
              type='button'
              className='btn-ghost'
              style={{ marginTop: 24, borderRadius: 8, fontWeight: 400 }}
              onClick={() => setSent(false)}
            >
              {t('sendAnother')}
            </button>
          </div>
        ) : (
          <form
            className='stack'
            style={{ gap: 16 }}
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
              <textarea className='input' rows={5} style={{ resize: 'vertical' }} required />
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
