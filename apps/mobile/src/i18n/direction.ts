import { I18nManager } from 'react-native';

/**
 * Makes the layout direction match the text language: mirrored for Arabic, not for English.
 * React Native applies a direction change only after a reload, so this reloads once when they differ.
 * Returns whether it had to. `lastTried` is the language a previous launch already reloaded for:
 * if the direction still doesn't match, it won't stick, so carry on unmirrored rather than reload forever.
 */
export function syncDirection(locale: 'en' | 'ar', isRTL: boolean, reload: () => void, lastTried: string | null = null): boolean {
  const rtl = locale === 'ar';
  if (isRTL === rtl || lastTried === locale) return false;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  reload();
  return true;
}
