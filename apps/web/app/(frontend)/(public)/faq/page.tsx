'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

const FAQS = ['book', 'cancel', 'types', 'becomeCoach', 'payouts', 'fee'] as const;

export default function FaqPage() {
  const t = useTranslations('faq');
  const [open, setOpen] = useState(0);
  return (
    <section className='site-section' style={{ maxWidth: 800 }}>
      <div className='eyebrow'>{t('eyebrow')}</div>
      <h1
        className='display lh-90'
        style={{ fontSize: 72, letterSpacing: 0, marginBottom: 40 }}
      >
        {t('title')}
      </h1>
      <div className='stack' style={{ gap: 10 }}>
        {FAQS.map((item, i) => (
          <div key={item} className='card' style={{ padding: 0, borderRadius: 12 }}>
            <button
              type='button'
              onClick={() => setOpen(open === i ? -1 : i)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
                background: 'none',
                border: 'none',
                color: 'var(--text)',
                padding: '20px 22px',
                fontSize: 16,
                fontWeight: 600,
                textAlign: 'start',
              }}
            >
              <span>{t(`items.${item}.q`)}</span>
              <span style={{ color: 'var(--accent-text)', fontSize: 20 }}>{open === i ? '–' : '+'}</span>
            </button>
            {open === i && (
              <div
                className='muted'
                style={{ padding: '0 22px 20px', fontSize: 15, lineHeight: 1.7 }}
              >
                {t(`items.${item}.a`)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
