import type { formats } from '@/i18n/formats'
import type { Messages } from '@/i18n/messages'

declare module 'next-intl' {
  interface AppConfig {
    Messages: Messages
    Formats: typeof formats
  }
}
