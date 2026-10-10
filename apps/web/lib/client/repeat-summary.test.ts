import { describe, expect, it } from 'vitest';
import { IntlMessageFormat } from 'intl-messageformat';
import { APP_TZ } from '@/i18n/locale';
import en from '@/messages/en.json';
import { summaryValues, type SummaryFormat } from './repeat-summary';

const fmt = (o: Intl.DateTimeFormatOptions) => (d: Date) => new Intl.DateTimeFormat('en-US', { timeZone: APP_TZ, ...o }).format(d);
const f: SummaryFormat = {
  weekdayLong: fmt({ weekday: 'long' }),
  day: fmt({ weekday: 'short' }),
  dayMonth: fmt({ day: 'numeric', month: 'short' }),
  time: fmt({ hour: 'numeric', minute: '2-digit' }),
};
const summary = (date: string, time: string, repeat: number) =>
  new IntlMessageFormat(en.schedule.summary, 'en-US').format(summaryValues(date, time, repeat, f)) as string;

describe('repeat summary', () => {
  it('describes a weekly run in Cairo time', () => {
    expect(summary('2026-10-20', '18:30', 4)).toBe('4 sessions, every Tuesday at 6:30 PM, starting Tue Oct 20.');
  });
  it('describes a single session', () => {
    expect(summary('2026-10-20', '07:00', 1)).toBe('One session on Tue Oct 20 at 7:00 AM.');
  });
  it('asks for the date and time until both are set', () => {
    expect(summary('', '18:30', 4)).toBe('Pick a date and start time.');
  });
});
