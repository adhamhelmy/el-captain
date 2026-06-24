import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@el-captain/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
}

export default config
