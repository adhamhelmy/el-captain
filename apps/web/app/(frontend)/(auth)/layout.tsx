import { Suspense } from 'react';
import { Logo } from '@/components/ui';

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className='auth'>
      <div className='auth-brand'>
        <Logo />
        <div>
          <div className='display' style={{ fontSize: 'clamp(56px, 7vw, 96px)', lineHeight: 0.88 }}>
            EVERY SESSION
            <br />
            <span style={{ color: 'var(--accent)' }}>COUNTS.</span>
          </div>
          <div
            className='muted'
            style={{ fontSize: 16, marginTop: 16, maxWidth: 380, lineHeight: 1.6 }}
          >
            Group classes and private coaching, booked in seconds.
          </div>
        </div>
      </div>
      <div className='auth-form'>
        <Suspense>{children}</Suspense>
      </div>
    </div>
  );
}
