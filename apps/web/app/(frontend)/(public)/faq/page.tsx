'use client';
import { useState } from 'react';

const FAQS = [
  [
    'How do I book a session?',
    'Create a free account, pick a session, and tap Reserve. You’ll get a confirmation by email and the session shows up under My sessions.',
  ],
  [
    'Can I cancel a booking?',
    'Yes. Cancel from My sessions up to 12 hours before the start for a full refund. Later cancellations follow the coach’s policy.',
  ],
  [
    'What’s the difference between group and private sessions?',
    'Group sessions have a fixed time and capacity. Private sessions are 1:1 with a coach and reserve the full slot for you.',
  ],
  [
    'How do I become a coach?',
    'Register as a coach and complete your profile. Our team reviews applications, usually within two business days.',
  ],
  [
    'How do coaches get paid?',
    'Payouts go out weekly to the account in your coach profile, minus the platform fee.',
  ],
  [
    'Is there a membership fee?',
    'No. Members pay per session; coaches pay a percentage only on completed bookings.',
  ],
];

export default function FaqPage() {
  const [open, setOpen] = useState(0);
  return (
    <section className='site-section' style={{ maxWidth: 800 }}>
      <div className='eyebrow'>FAQ</div>
      <h1
        className='display'
        style={{ fontSize: 72, lineHeight: 0.9, letterSpacing: 0, marginBottom: 40 }}
      >
        QUESTIONS
      </h1>
      <div className='stack' style={{ gap: 10 }}>
        {FAQS.map(([q, a], i) => (
          <div key={q} className='card' style={{ padding: 0, borderRadius: 12 }}>
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
                textAlign: 'left',
              }}
            >
              <span>{q}</span>
              <span style={{ color: 'var(--accent)', fontSize: 20 }}>{open === i ? '–' : '+'}</span>
            </button>
            {open === i && (
              <div
                className='muted'
                style={{ padding: '0 22px 20px', fontSize: 15, lineHeight: 1.7 }}
              >
                {a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
