import { Redirect } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { homeFor } from '@/auth/home';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';
import { useTranslations } from 'use-intl';

/** Placeholder until slice 3 builds the onboarding wizard. */
export default function Onboarding() {
  const t = useTranslations();
  const { user, signOut } = useAuth();
  if (homeFor(user) !== '/onboarding') return <Redirect href={homeFor(user)} />;
  return (
    <Screen tabs={false}>
      <Text variant="display">{t('onboarding.title')}</Text>
      <Text muted>{t('common.comingSoon')}</Text>
      <Button label={t('common.logOut')} variant="secondary" onPress={signOut} />
    </Screen>
  );
}
