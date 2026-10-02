'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Avatar, Field, Toggle } from '@/components/ui';
import { categories, ME, user } from '@/lib/mock';

export default function UserProfilePage() {
  const me = user(ME.user)!;
  const [form, setForm] = useState({ name: me.name, email: me.email, phone: me.phone });
  const [favs, setFavs] = useState(['Yoga', 'Spin']);
  const [reminders, setReminders] = useState(true);
  const [saved, setSaved] = useState(false);

  const edit = (patch: Partial<typeof form>) => {
    setForm({ ...form, ...patch });
    setSaved(false);
  };
  const toggleFav = (c: string) => {
    setFavs(favs.includes(c) ? favs.filter((f) => f !== c) : [...favs, c]);
    setSaved(false);
  };

  return (
    <div className='page stack' style={{ maxWidth: 720, gap: 24 }}>
      <div className='title'>PROFILE</div>
      <div className='card stack' style={{ gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar initials={me.initials} size={64} fontSize={22} accent />
          <div>
            <div style={{ fontWeight: 700, fontSize: 19 }}>{form.name}</div>
            <div className='muted' style={{ fontSize: 14 }}>
              Member since {me.joined}
            </div>
          </div>
        </div>
        <div className='fields' style={{ paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          <Field label='Full name'>
            <input
              className='input'
              value={form.name}
              onChange={(e) => edit({ name: e.target.value })}
            />
          </Field>
          <Field label='Email'>
            <input
              className='input'
              value={form.email}
              onChange={(e) => edit({ email: e.target.value })}
            />
          </Field>
          <Field label='Phone'>
            <input
              className='input'
              value={form.phone}
              onChange={(e) => edit({ phone: e.target.value })}
            />
          </Field>
        </div>
        <div>
          <div className='label' style={{ marginBottom: 10 }}>
            Favourite disciplines
          </div>
          <div className='chips'>
            {categories.slice(1).map((c) => (
              <button
                key={c}
                type='button'
                className={favs.includes(c) ? 'chip on' : 'chip'}
                onClick={() => toggleFav(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className='card stack' style={{ gap: 18 }}>
        <div className='h3'>SETTINGS</div>
        <div className='setting'>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Email reminders</div>
            <div className='muted' style={{ fontSize: 13 }}>
              A reminder 2 hours before each session
            </div>
          </div>
          <Toggle
            on={reminders}
            onChange={(v) => {
              setReminders(v);
              setSaved(false);
            }}
          />
        </div>
        <div className='setting'>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Password</div>
            <div className='muted' style={{ fontSize: 13 }}>
              Last changed 3 months ago
            </div>
          </div>
          <Link
            href='/reset-password'
            className='btn-ghost sm plain'
            style={{ padding: '9px 14px' }}
          >
            Change
          </Link>
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
