import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { buildSessionLabels } from '@el-captain/rules/session-labels';
import { appLocale } from '@/i18n/locale';

export { buildSessionLabels, type SessionLabels, type SessionLike } from '@el-captain/rules/session-labels';

/** Same labels in a component, from the request's locale and formats. */
export const useSessionLabels = () => buildSessionLabels(useTranslations('data'), useFormatter(), appLocale(useLocale()));
