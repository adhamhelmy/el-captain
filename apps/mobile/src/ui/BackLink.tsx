import { router } from 'expo-router';
import { useLocale } from '@/i18n/IntlProvider';
import { LinkText } from './LinkText';

/** The web's Back link: an arrow pointing to the start side, then where it goes. Goes back, or home when there's no history. */
export function BackLink({ label }: Readonly<{ label: string }>) {
  const { isRTL } = useLocale();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return <LinkText label={`${isRTL ? '→' : '←'} ${label}`} onPress={back} muted />;
}
