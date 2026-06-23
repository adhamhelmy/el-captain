import { describe, it, expect } from 'vitest'
import { prisma } from './prisma'

describe('prisma singleton', () => {
  it('exports a PrismaClient instance', () => {
    expect(prisma).toBeDefined()
    expect(typeof prisma.user.findMany).toBe('function')
  })
})
