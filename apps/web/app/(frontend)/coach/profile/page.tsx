'use client';
import { useState } from 'react';
import { Avatar, Field, Toggle } from '@/components/ui';
import { categories, coach, ME } from '@/lib/mock';

export default function CoachProfilePage() {
  const me = coach(ME.coach)!;
  const [form, setForm] = useState({
    name: me.name,
    specialty: me.specialty,
    location: me.location,
    rate: String(me.rate),
    bio: me.bio,
    email: me.email,
    payout: 'Chase •••• 4821',
  });
  const [notify, setNotify] = useState(true);
  const [saved, setSaved] = useState(false);

  const input = (key: keyof typeof form) => ({
    className: 'input',
    value: form[key],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      setForm({ ...form, [key]: e.target.value });
      setSaved(false);
    },
  });

  return (
    <div className='page stack' style={{ maxWidth: 760, gap: 24 }}>
      <div className='title'>PROFILE</div>
      <div className='card stack' style={{ gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Avatar initials={me.initials} size={64} fontSize={22} accent />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 19 }}>{form.name}</div>
            <div className='muted' style={{ fontSize: 14 }}>
              {form.specialty} coach · {form.location}
            </div>
          </div>
        </div>
        <div className='fields' style={{ paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          <Field label='Display name'>
            <input {...input('name')} />
          </Field>
          <Field label='Specialty'>
            <select {...input('specialty')}>
              {categories.slice(1).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label='Location'>
            <input {...input('location')} />
          </Field>
          <Field label='1:1 rate ($ / hour)'>
            <input {...input('rate')} />
          </Field>
        </div>
        <Field label='Bio'>
          <textarea rows={4} {...input('bio')} style={{ lineHeight: 1.6, resize: 'vertical' }} />
        </Field>
      </div>
      <div className='card stack' style={{ gap: 18 }}>
        <div className='h3'>ACCOUNT &amp; PAYOUTS</div>
        <div className='fields'>
          <Field label='Email'>
            <input {...input('email')} />
          </Field>
          <Field label='Payout account'>
            <input {...input('payout')} />
          </Field>
        </div>
        <div className='setting'>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Booking notifications</div>
            <div className='muted' style={{ fontSize: 13 }}>
              Email me for new bookings and cancellations
            </div>
          </div>
          <Toggle
            on={notify}
            onChange={(v) => {
              setNotify(v);
              setSaved(false);
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type='button'
          className='btn'
          style={{ fontSize: 15, padding: '13px 24px' }}
          onClick={() => setSaved(true)}
        >
          Save changes
        </button>
        {saved && <span style={{ color: 'var(--accent)', fontSize: 14 }}>Saved</span>}
      </div>
    </div>
  );
}
