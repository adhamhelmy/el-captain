import { describe, expect, it } from 'vitest';
import { SEARCH_MAX } from '@/lib/shared/coach-rules';
import { date, many, oneOf, readFilter, search, text } from './query-filter';

const query = (qs: string) => {
  const p = new URLSearchParams(qs);
  return { get: (k: string) => p.get(k) ?? undefined, getAll: (k: string) => p.getAll(k) };
};

describe('readFilter', () => {
  const spec = { q: search(), sportId: text('sport'), sportIds: many('sport'), status: oneOf('status', ['ACTIVE', 'SUSPENDED']), from: date('from') };

  it('reads each named param', () => {
    expect(readFilter(query('q=%20mona%20&sport=s1&sport=s2&status=ACTIVE&from=2026-10-20T10:00:00Z'), spec)).toEqual({
      q: 'mona',
      sportId: 's1',
      sportIds: ['s1', 's2'],
      status: 'ACTIVE',
      from: new Date('2026-10-20T10:00:00Z'),
    });
  });

  it('treats blank and unknown values as no filter', () => {
    expect(readFilter(query('q=%20%20&sport=&status=nope&from=soon'), spec)).toEqual({
      q: undefined,
      sportId: undefined,
      sportIds: [],
      status: undefined,
      from: undefined,
    });
  });
});

describe('search', () => {
  it('cuts a long search', () => {
    expect(search()(query(`q=${'a'.repeat(SEARCH_MAX + 5)}`))).toHaveLength(SEARCH_MAX);
  });
});

describe('oneOf', () => {
  it('uses the fallback for a missing or unknown value', () => {
    const when = oneOf('when', ['upcoming', 'past'], 'upcoming');
    expect(when(query('when=past'))).toBe('past');
    expect(when(query('when=later'))).toBe('upcoming');
    expect(when(query(''))).toBe('upcoming');
  });
});
