#!/usr/bin/env node
// Flags likely hard-coded English in TSX: JSX text and common text props.
// Usage: node scripts/untranslated.mjs [files or dirs…]  (defaults to app/(frontend), app/not-found.tsx and components)
// Scans with plain string operations rather than big regexes, so it stays linear on any input.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const TEXT_PROP = /\b(placeholder|title|aria-label|alt|label|link|sub)=(['"])/g
const GLYPHS = new Set('★·—–×+-/:%.,() \n\t0123456789')
const CODE_HINTS = ['=>', 'const ', 'return ', 'if ', '&&', '||', ';']

const hasWord = (s) => /[A-Za-z]{2}/.test(s)
// Glyph-only strings and example emails are the same in every language.
const allowed = (s) => [...s].every((c) => GLYPHS.has(c)) || (s.includes('@') && !s.includes(' '))
const codeLike = (s) => CODE_HINTS.some((k) => s.includes(k))

function walk(p) {
  if (statSync(p).isDirectory()) return readdirSync(p).flatMap((f) => walk(join(p, f)))
  return p.endsWith('.tsx') ? [p] : []
}

/** Blanks `{/* … *\/}` and `//` comments, keeping every newline so line numbers stay right. */
function stripComments(src) {
  let out = src
  for (let start = out.indexOf('{/*'); start !== -1; start = out.indexOf('{/*', start)) {
    const end = out.indexOf('*/}', start)
    if (end === -1) break
    const blank = out.slice(start, end + 3).replace(/[^\n]/g, ' ')
    out = out.slice(0, start) + blank + out.slice(end + 3)
  }
  return out
    .split('\n')
    .map((line) => (line.trim().startsWith('//') ? '' : line))
    .join('\n')
}

/** [index, text] for each run of JSX text: whatever sits between a `>` and the next `<`. */
function jsxTexts(src) {
  const found = []
  let from = 0
  for (const piece of src.split('<')) {
    const gt = piece.lastIndexOf('>')
    const text = piece.slice(gt + 1)
    if (gt !== -1 && !text.includes('{') && !text.includes('}')) found.push([from + gt + 1, text])
    from += piece.length + 1
  }
  return found
}

/** [index, value] for each quoted text prop such as placeholder='…'. */
function propTexts(src) {
  const found = []
  for (const m of src.matchAll(TEXT_PROP)) {
    const start = m.index + m[0].length
    const end = src.indexOf(m[2], start)
    if (end !== -1) found.push([start, src.slice(start, end)])
  }
  return found
}

const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['app/(frontend)', 'app/not-found.tsx', 'components']
let found = 0
for (const file of roots.flatMap(walk)) {
  const src = stripComments(readFileSync(file, 'utf8'))
  for (const [index, raw] of [...jsxTexts(src), ...propTexts(src)]) {
    const text = raw.replaceAll(/\s+/g, ' ').trim()
    if (!text || !hasWord(text) || allowed(text) || codeLike(text)) continue
    console.log(`${file}:${src.slice(0, index).split('\n').length}: ${text}`)
    found++
  }
}
process.exit(found ? 1 : 0)
