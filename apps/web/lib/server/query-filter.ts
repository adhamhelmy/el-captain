import type { Query } from '@/lib/server/api';
import { SEARCH_MAX } from '@/lib/shared/coach-rules';

/** Reads one filter value from the URL's search params. Blank or unknown values come back as "no filter". */
export type Param<T> = (query: Query) => T;

/** A free-text search, trimmed and cut to SEARCH_MAX. */
export const search =
  (key = 'q'): Param<string | undefined> =>
  (query) =>
    query.get(key)?.trim().slice(0, SEARCH_MAX) || undefined;

/** A single value as given, e.g. an id. */
export const text =
  (key: string): Param<string | undefined> =>
  (query) =>
    query.get(key) || undefined;

/** Every value of a repeated param (?sport=a&sport=b), blanks dropped. */
export const many =
  (key: string): Param<string[]> =>
  (query) =>
    query.getAll(key).filter(Boolean);

/** A valid date, or undefined. */
export const date =
  (key: string): Param<Date | undefined> =>
  (query) => {
    const value = query.get(key);
    const d = value ? new Date(value) : null;
    return d && !Number.isNaN(d.getTime()) ? d : undefined;
  };

/** One of the allowed values; anything else is the fallback (undefined unless given). */
export function oneOf<T extends string>(key: string, allowed: readonly T[]): Param<T | undefined>;
export function oneOf<T extends string>(key: string, allowed: readonly T[], fallback: T): Param<T>;
export function oneOf<T extends string>(key: string, allowed: readonly T[], fallback?: T): Param<T | undefined> {
  return (query) => {
    const value = query.get(key);
    return allowed.includes(value as T) ? (value as T) : fallback;
  };
}

/** Reads a whole filter from a spec of named params, e.g. `readFilter(query, { q: search(), sportId: text('sport') })`. */
export function readFilter<S extends Record<string, Param<unknown>>>(query: Query, spec: S): { [K in keyof S]: ReturnType<S[K]> } {
  return Object.fromEntries(Object.entries(spec).map(([name, read]) => [name, read(query)])) as { [K in keyof S]: ReturnType<S[K]> };
}
