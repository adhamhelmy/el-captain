import { fromWallClock } from '@el-captain/rules/app-time';
import { TEXT_MAX } from '@el-captain/rules/session-rules';
import { typedDate, typedTime } from '@/account/typed-date';

/** `startsAtFormat`: the date or time isn't readable; `startsAt`: it is, but not in the future. */
export type RequestField = 'venueId' | 'sportId' | 'startsAt' | 'startsAtFormat' | 'message';
export type RequestDraft = { venueId: string; sportId: string; date: string; time: string; message: string };

/** The typed date and time as an instant (Cairo wall clock), or null when either can't be read. */
export function requestStart(d: Pick<RequestDraft, 'date' | 'time'>): Date | null {
  const date = typedDate(d.date);
  const time = typedTime(d.time);
  return date && time ? fromWallClock({ date, time }) : null;
}

/** The fields a private request can't be sent with, as the web's PrivateRequestForm checks them. */
export function requestProblems(d: RequestDraft, now = new Date()): RequestField[] {
  const startsAt = requestStart(d);
  let when: RequestField[] = [];
  if (!startsAt) when = ['startsAtFormat'];
  else if (startsAt <= now) when = ['startsAt'];
  return [
    ...(d.venueId ? [] : (['venueId'] as const)),
    ...(d.sportId ? [] : (['sportId'] as const)),
    ...when,
    ...(d.message.trim().length > TEXT_MAX ? (['message'] as const) : []),
  ];
}
