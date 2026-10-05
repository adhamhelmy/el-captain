import { describe, expect, it } from 'vitest'
import { clientsOfCoach, sessions, startFor, weekdayKey } from './mock'

describe('mock dates', () => {
  it('reads the weekday in the app timezone', () => {
    expect(weekdayKey('2026-10-05T06:30:00-06:00')).toBe('mon')
    // 23:30 Denver is already Tuesday in UTC; must still be Monday here.
    expect(weekdayKey('2026-10-05T23:30:00-06:00')).toBe('mon')
  })
  it('builds a start time in the mock week', () => {
    expect(startFor('mon', '06:30')).toBe('2026-10-05T06:30:00-06:00')
    expect(startFor('sat', '09:00')).toBe('2026-10-10T09:00:00-06:00')
    expect(startFor('sun', '18:15')).toBe('2026-10-11T18:15:00-06:00')
  })
  it('every session start is a valid ISO date', () => {
    for (const s of sessions) expect(Number.isNaN(Date.parse(s.start)), s.title).toBe(false)
  })
  it('client last visit is the latest past session, or null', () => {
    const clients = clientsOfCoach(1)
    expect(clients.length).toBeGreaterThan(0)
    for (const c of clients) {
      const past = c.history.filter((s) => s.status === 'past').map((s) => s.start).sort()
      expect(c.last).toBe(past.at(-1) ?? null)
    }
  })
})
