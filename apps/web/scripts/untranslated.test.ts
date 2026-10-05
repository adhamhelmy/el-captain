import { execFileSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('no hard-coded English left in the UI', () => {
  let out = ''
  try {
    execFileSync('node', ['scripts/untranslated.mjs'], { encoding: 'utf8' })
  } catch (e) {
    out = (e as { stdout: string }).stdout
  }
  expect(out).toBe('')
})
