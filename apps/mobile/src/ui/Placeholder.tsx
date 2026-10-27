import { useTranslations } from 'use-intl';
import { Screen } from './Screen';
import { Text } from './Text';

/** Stand-in for a screen a later slice builds: its title from the web's strings. */
export function Placeholder({ titleKey }: Readonly<{ titleKey: string }>) {
  const t = useTranslations();
  return (
    <Screen>
      <Text variant="display">{t(titleKey)}</Text>
      <Text muted>{t('common.comingSoon')}</Text>
    </Screen>
  );
}
