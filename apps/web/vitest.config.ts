import { defineConfig } from 'vitest/config'
import path from 'path'
export default defineConfig({
  test: {
    environment: 'node',
    // lcov is read by SonarQube (sonar.javascript.lcov.reportPaths).
    coverage: { provider: 'v8', reporter: ['lcov', 'text-summary'], reportsDirectory: 'coverage' },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') }
  }
})
