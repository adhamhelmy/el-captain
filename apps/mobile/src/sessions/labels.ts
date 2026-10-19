import { buildSessionLabels } from '@el-captain/rules/session-labels';
import { useFormatter, useTranslations } from 'use-intl';
import { useLocale } from '@/i18n/IntlProvider';

/** The web's session labels (apps/web/lib/client/session-labels.ts), from the app's locale and formats. */
export const useSessionLabels = () => buildSessionLabels(useTranslations('data'), useFormatter(), useLocale().locale);
