import { describe, it, expect } from 'vitest'
import { authOptions } from './auth'

describe('authOptions', () => {
  it('uses jwt session strategy', () => {
    expect(authOptions.session?.strategy).toBe('jwt')
  })

  it('has credentials provider', () => {
    expect(authOptions.providers).toHaveLength(1)
    expect(authOptions.providers[0].id).toBe('credentials')
  })

  it('redirects sign-in to /auth/login', () => {
    expect(authOptions.pages?.signIn).toBe('/auth/login')
  })
})
