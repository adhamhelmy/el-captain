/**
 * Intl pieces the phone's JS engine (Hermes) lacks: use-intl needs PluralRules for every {count, plural, …} message,
 * and the PluralRules polyfill needs Locale. Each only installs where missing, so the web preview keeps the browser's.
 * Order matters. src/i18n/hermes.test.ts checks every message renders without them.
 */
import '@formatjs/intl-getcanonicallocales/polyfill.js';
import '@formatjs/intl-locale/polyfill.js';
import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/ar.js';
