// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    // A promise nobody awaits or catches fails silently (SonarCloud flags these too). Needs type information.
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: { parser: tsParser, parserOptions: { projectService: true } },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: { '@typescript-eslint/no-floating-promises': 'error' },
  },
]);
