import { useTranslations } from 'use-intl';
import { Settings } from '@/account/Settings';
import { useAuth } from '@/auth/AuthProvider';
import { Screen } from '@/ui/Screen';
import { Text } from '@/ui/Text';

/** Settings only for now; the coach's public profile editing comes with the coach side (slice 3). */
export default function CoachProfile() {
  const t = useTranslations();
  const { user } = useAuth();
  return (
    <Screen>
      <Text variant="display">{t('nav.profile')}</Text>
      <Text>{user?.name}</Text>
      <Text muted>{user?.email}</Text>
      <Settings />
    </Screen>
  );
}
