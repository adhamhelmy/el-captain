import type { NextConfig } from 'next'
import path from 'node:path'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const config: NextConfig = {
  // The repo root; without it Turbopack picks up a stray ~/package-lock.json and watches the whole home folder.
  turbopack: { root: path.resolve(__dirname, '../..') },
  transpilePackages: ['@el-captain/types', '@el-captain/messages', '@el-captain/rules'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // Development only: lets the mobile app's web preview (Expo on :8081) call this API from the browser.
  // Phones don't need CORS, and production sends no CORS headers.
  async headers() {
    if (process.env.NODE_ENV !== 'development') return []
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'http://localhost:8081' },
          { key: 'Access-Control-Allow-Headers', value: 'authorization, content-type, accept, accept-language' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, PUT, DELETE, OPTIONS' },
        ],
      },
    ]
  },
}

export default withNextIntl(config)
