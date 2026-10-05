import { describe, expect, it } from 'vitest'
import { canAccess, homeForRole } from './routes'

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

describe('homeForRole', () => {
  it('sends each role to its own dashboard', () => {
    expect(homeForRole('ADMIN')).toBe('/admin/dashboard')
    expect(homeForRole('COACH')).toBe('/coach/dashboard')
    expect(homeForRole('STUDIO')).toBe('/coach/dashboard')
    expect(homeForRole('USER')).toBe('/user/dashboard')
  })

  it('sends unknown or missing roles to the home page', () => {
    expect(homeForRole(undefined)).toBe('/')
    expect(homeForRole('GUEST')).toBe('/')
  })
})
