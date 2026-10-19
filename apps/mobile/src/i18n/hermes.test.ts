/**
 * The phone runs Hermes, whose Intl is smaller than a browser's or Node's, so a message can format fine here and in the
 * web preview yet fail on the phone. These tests take away what Hermes lacks, then load the app's polyfills and render
 * every message in both languages, and scan the code for APIs nothing polyfills.
 */
/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  isArgumentElement,
  isDateElement,
  isNumberElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  isTimeElement,
  parse,
  type MessageFormatElement,
} from '@formatjs/icu-messageformat-parser';

/** Intl constructors Hermes on iOS and Android does not have. */
const HERMES_MISSING = ['PluralRules', 'Locale', 'ListFormat', 'RelativeTimeFormat', 'DisplayNames', 'Segmenter', 'DurationFormat'] as const;

type Messages = { [key: string]: string | Messages };

function flatten(messages: Messages, prefix = ''): [string, string][] {
  return Object.entries(messages).flatMap(([k, v]) => (typeof v === 'string' ? [[prefix + k, v] as [string, string]] : flatten(v, `${prefix}${k}.`)));
}

/** A value for every argument a message takes; plural arguments get `count`, tags get a pass-through. */
function valuesFor(els: MessageFormatElement[], count: number, out: Record<string, unknown> = {}) {
  for (const el of els) {
    if (isTagElement(el)) {
      out[el.value] = (chunks: string[]) => chunks.join('');
      valuesFor(el.children, count, out);
    } else if (isPluralElement(el) || isSelectElement(el)) {
      out[el.value] = isPluralElement(el) ? count : 'other';
      for (const opt of Object.values(el.options)) valuesFor(opt.value, count, out);
    } else if (isDateElement(el) || isTimeElement(el)) {
      out[el.value] = new Date(Date.UTC(2026, 9, 19, 15, 30));
    } else if (isArgumentElement(el) || isNumberElement(el)) {
      out[el.value] = count;
    }
  }
  return out;
}

type Translate = (key: string, values: object) => string;

/** The app's polyfills, then use-intl, each loaded fresh so they see Intl as Hermes has it. */
function loadOnHermes(locale: 'en' | 'ar', namespace?: string) {
  const errors: string[] = [];
  let loaded!: { t: Translate; messages: Messages };
  // Loaded inside isolateModules, after Intl is cut down, so a static import would be too early.
  /* eslint-disable @typescript-eslint/no-require-imports */
  jest.isolateModules(() => {
    require('./polyfills');
    const { createTranslator } = require('use-intl') as typeof import('use-intl');
    const { INTL_LOCALE, APP_TZ } = require('./locale') as typeof import('./locale');
    const messages = (require('@el-captain/messages') as Record<'en' | 'ar', Messages>)[locale];
    const t = createTranslator({ locale: INTL_LOCALE[locale], messages, namespace, timeZone: APP_TZ, onError: (e) => errors.push(e.message) });
    loaded = { t: t as unknown as Translate, messages };
  });
  /* eslint-enable @typescript-eslint/no-require-imports */
  return { ...loaded, errors };
}

describe('messages on Hermes', () => {
  const saved: Record<string, unknown> = {};
  beforeAll(() => {
    for (const name of HERMES_MISSING) {
      saved[name] = (Intl as Record<string, unknown>)[name];
      delete (Intl as Record<string, unknown>)[name];
    }
  });
  afterAll(() => Object.assign(Intl, saved));

  it.each(['en', 'ar'] as const)('every %s message renders with the polyfills loaded', (locale) => {
    const { t, errors, messages } = loadOnHermes(locale);
    const entries = flatten(messages);
    expect(entries.length).toBeGreaterThan(100);
    for (const [key, text] of entries) {
      const ast = parse(text);
      // Arabic has six plural forms; these counts reach each of them.
      for (const count of [0, 1, 2, 3, 11, 100]) t(key, valuesFor(ast, count));
    }
    expect([...new Set(errors)]).toEqual([]);
  });

  it('Arabic picks the right plural form', () => {
    const { t } = loadOnHermes('ar', 'venues');
    expect([1, 2, 3, 11].map((count) => t('count', { count }))).toEqual(['مكان واحد', 'مكانين', '3 أماكن', '11 مكان']);
  });
});

/** APIs Hermes lacks that the polyfills don't add, and use-intl formatters built on them. */
const UNSUPPORTED = [
  { pattern: /\bIntl\.(DisplayNames|ListFormat|RelativeTimeFormat|Segmenter|DurationFormat)\b/, why: 'not in Hermes and not polyfilled' },
  { pattern: /\bcrypto\.randomUUID\b/, why: 'not in Hermes' },
  { pattern: /\bformat\.(relativeTime|list)\(/, why: 'use-intl needs Intl.RelativeTimeFormat / Intl.ListFormat, not in Hermes' },
];

/** The app's own code and the shared rules it bundles. */
const ROOTS = [join(__dirname, '..'), join(__dirname, '../../../../packages/rules'), join(__dirname, '../../../../packages/types')];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === 'node_modules') return [];
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

it('no code uses an API Hermes lacks', () => {
  const found = ROOTS.flatMap(sourceFiles).flatMap((file) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return [];
        const hit = UNSUPPORTED.find((u) => u.pattern.test(line));
        return hit ? [`${relative(join(__dirname, '../../../..'), file)}:${i + 1} ${hit.why}`] : [];
      }),
  );
  expect(found).toEqual([]);
});
