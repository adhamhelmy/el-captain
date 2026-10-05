import type { Formats } from 'next-intl'

export const formats = {
  dateTime: {
    weekday: { weekday: 'short' },
    dayMonth: { day: 'numeric', month: 'short' },
    dayMonthYear: { day: 'numeric', month: 'short', year: 'numeric' },
    monthYear: { month: 'short', year: 'numeric' },
    time: { hour: 'numeric', minute: '2-digit' },
  },
} satisfies Formats
