import { defineConfig } from 'vitest/config'
import path from 'node:path'
export default defineConfig({
  test: {
    environment: 'node',
    // lcov is read by SonarQube (sonar.javascript.lcov.reportPaths), which scans from the repo root,
    // so its paths are written relative to the root (apps/web/...) instead of this package.
    coverage: {
      provider: 'v8',
      reporter: [['lcov', { projectRoot: path.resolve(__dirname, '../..') }], 'text-summary'],
      reportsDirectory: 'coverage',
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') }
  }
})
