import { beforeEach, describe, expect, it, vi } from 'vitest'

const set = vi.fn()
vi.mock('next/headers', () => ({ cookies: async () => ({ set }) }))

import { setLocale } from './actions'

describe('setLocale', () => {
  beforeEach(() => set.mockClear())

  it('stores a supported locale for a year', async () => {
    await setLocale('ar')
    expect(set).toHaveBeenCalledWith('locale', 'ar', {
      path: '/',
      maxAge: 31_536_000,
      sameSite: 'lax',
    })
  })

  it('rejects anything else without touching the cookie', async () => {
    await expect(setLocale('fr' as never)).rejects.toThrow('Unsupported locale')
    expect(set).not.toHaveBeenCalled()
  })
})
