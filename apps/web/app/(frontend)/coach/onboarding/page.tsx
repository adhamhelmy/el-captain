'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { getOnboarding, type Onboarding } from '@/lib/client/coach-api';
import { StatusScreen } from './StatusScreen';
import { TopBar } from './TopBar';
import { Wizard } from './Wizard';
import styles from './onboarding.module.css';

/** Where a coach lands until approved: the profile wizard, or the in-review / suspended screen. */
export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const te = useTranslations('errors');
  const router = useRouter();
  const { update } = useSession();
  const [data, setData] = useState<Onboarding | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      getOnboarding().then((res) => {
        if (res.ok) setData(res.data);
        else setError(te('generic'));
      }),
    [te],
  );

  useEffect(() => {
    load();
  }, [load]);

  // An admin's decision reaches the session on the next read; check whenever the coach comes back to the tab.
  const status = data?.coach.status;
  useEffect(() => {
    const onFocus = async () => {
      const s = await update();
      if (s?.user.coachStatus === 'ACTIVE') router.replace('/coach/dashboard');
      else if (s?.user.coachStatus && s.user.coachStatus !== status) load();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [update, router, load, status]);

  // An approved coach can arrive here on a stale session (e.g. from the approval email in a new tab):
  // refresh the session so the route guard knows, then go to the dashboard.
  useEffect(() => {
    if (status === 'ACTIVE') update().then(() => router.replace('/coach/dashboard'));
  }, [status, update, router]);

  if (!data || status === 'ACTIVE') {
    return (
      <div className={styles.screen}>
        <TopBar />
        <div className={styles.loading}>{error ? <span className={styles.error}>{error}</span> : t('loading')}</div>
      </div>
    );
  }

  if (status === 'PENDING' || status === 'SUSPENDED') return <StatusScreen data={data} />;

  // Keyed by status so a rejected profile coming back opens the wizard fresh.
  return (
    <Wizard
      key={status}
      data={data}
      onSubmitted={async () => {
        await update();
        await load();
      }}
    />
  );
}
