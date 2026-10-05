import ar from '@/messages/ar.json'
import en from '@/messages/en.json'
import type { AppLocale } from './locale'

export type Messages = typeof en
/** Static imports: two small files, and tests can load them without Next. */
export const MESSAGES: Record<AppLocale, Messages> = { en, ar }
