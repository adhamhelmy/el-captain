/**
 * The spoken-language names the web gets from Intl.DisplayNames, written out because the phone's JS engine (Hermes)
 * may not have it. Covers SPOKEN_LANGUAGES in @el-captain/rules/profile-rules.
 */
const NAMES: Record<'en' | 'ar', Record<string, string>> = {
  en: { ar: 'Arabic', en: 'English', fr: 'French', de: 'German', it: 'Italian', es: 'Spanish', ru: 'Russian' },
  ar: { ar: 'العربية', en: 'الإنجليزية', fr: 'الفرنسية', de: 'الألمانية', it: 'الإيطالية', es: 'الإسبانية', ru: 'الروسية' },
};

export const languageName = (code: string, locale: string) => NAMES[locale.startsWith('ar') ? 'ar' : 'en'][code] ?? code;
