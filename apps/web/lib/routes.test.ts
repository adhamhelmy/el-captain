import { describe, expect, it } from 'vitest'
import { canAccess } from './routes'

describe('canAccess', () => {
  it('keeps each role in its own area', () => {
    expect(canAccess('ADMIN', '/admin/dashboard')).toBe(true)
    expect(canAccess('ADMIN', '/user/sessions/1')).toBe(false)
    expect(canAccess('USER', '/user/sessions/1?x=1')).toBe(true)
    expect(canAccess('STUDIO', '/coach/dashboard')).toBe(true)
  })

  it('treats non-area paths as public', () => {
    expect(canAccess(undefined, '/sessions/1')).toBe(true)
    expect(canAccess(undefined, '/user')).toBe(false)
  })
})
