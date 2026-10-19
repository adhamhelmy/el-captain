import { ar, en, type Messages } from '@el-captain/messages'
import type { AppLocale } from './locale'

export type { Messages }
/** Static imports: two small files, and tests can load them without Next. */
export const MESSAGES: Record<AppLocale, Messages> = { en, ar }
