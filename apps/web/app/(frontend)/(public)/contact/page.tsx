'use client';
import { useState } from 'react';
import { Field } from '@/components/ui';

export default function ContactPage() {
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
        <div className='eyebrow'>Contact</div>
        <h1 className='display' style={{ fontSize: 72, lineHeight: 0.9, letterSpacing: 0 }}>
          GET IN TOUCH
        </h1>
        <p className='muted' style={{ fontSize: 16, lineHeight: 1.7, margin: '20px 0 32px' }}>
          Questions about a booking, coaching on the platform, or partnerships. We reply within one
          business day.
        </p>
        <div className='stack' style={{ gap: 14, fontSize: 15 }}>
          {[
            ['Email', 'support@elcaptain.app'],
            ['Coaches', 'coaches@elcaptain.app'],
          ].map(([label, email]) => (
            <div key={label}>
              <div
                className='dim'
                style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}
              >
                {label}
              </div>
              <a href={`mailto:${email}`}>{email}</a>
            </div>
          ))}
        </div>
      </div>
      <div className='card'>
        {sent ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div className='display' style={{ fontSize: 36 }}>
              MESSAGE SENT
            </div>
            <div className='muted' style={{ fontSize: 15, marginTop: 8 }}>
              Thanks — we’ll be in touch soon.
            </div>
            <button
              type='button'
              className='btn-ghost'
              style={{ marginTop: 24, borderRadius: 8, fontWeight: 400 }}
              onClick={() => setSent(false)}
            >
              Send another
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
            <Field label='Name'>
              <input className='input' required />
            </Field>
            <Field label='Email'>
              <input className='input' type='email' required />
            </Field>
            <Field label='Topic'>
              <select className='input'>
                <option>A booking</option>
                <option>Coaching on El Captain</option>
                <option>Partnerships</option>
                <option>Something else</option>
              </select>
            </Field>
            <Field label='Message'>
              <textarea className='input' rows={5} style={{ resize: 'vertical' }} required />
            </Field>
            <button type='submit' className='btn block'>
              Send message
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
