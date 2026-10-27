import { Redirect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'use-intl';
import { api } from '@/api/client';
import type { Onboarding } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { homeFor } from '@/auth/home';
import { StatusScreen } from '@/onboarding/StatusScreen';
import { Wizard } from '@/onboarding/Wizard';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

/**
 * The web's onboarding page: where a coach lands until approved. The profile wizard, or the in-review / suspended
 * screen. An admin's decision reaches the app when it comes back to the foreground (AuthProvider refreshes the user).
 */
export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const { colors } = useTheme();
  const { user, refresh } = useAuth();
  const [data, setData] = useState<Onboarding | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(
    () =>
      api<Onboarding>('/api/coaches/me/onboarding')
        .then((d) => {
          setData(d);
          setError(false);
        })
        .catch(() => setError(true)),
    [],
  );

  // Reloads when the user's coach status changes (submitted, approved, rejected), so the right screen shows.
  const coachStatus = user?.coachStatus;
  useEffect(() => {
    void load();
  }, [load, coachStatus]);

  // Approved while the app was open on a stale user: refresh it so the redirect below takes them to the dashboard.
  const status = data?.coach.status;
  useEffect(() => {
    if (status === 'ACTIVE' && coachStatus !== 'ACTIVE') void refresh();
  }, [status, coachStatus, refresh]);

  if (homeFor(user) !== '/onboarding') return <Redirect href={homeFor(user)} />;
  if (!data || status === 'ACTIVE') {
    return (
      <Screen tabs={false}>
        <Text muted style={error ? { color: colors.warn } : undefined}>
          {error ? te('generic') : t('loading')}
        </Text>
        {error && <Button label={tc('tryAgain')} onPress={load} />}
      </Screen>
    );
  }
  if (status === 'PENDING' || status === 'SUSPENDED') return <StatusScreen data={data} />;
  // Keyed by status so a rejected profile coming back opens the wizard fresh.
  return (
    <Wizard
      key={status}
      data={data}
      onSubmitted={async () => {
        await refresh();
        await load();
      }}
    />
  );
}
