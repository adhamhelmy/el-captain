import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { SessionProvider } from '@/components/SessionProvider'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'El Captain', template: '%s | El Captain' },
  description: 'Discover and book fitness classes near you — kickboxing, yoga, pilates, crossfit and more.',
  openGraph: {
    title: 'El Captain — Find Fitness Classes',
    description: 'Discover and book fitness classes near you.',
    type: 'website',
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏋️</text></svg>",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <MantineProvider>
          <Notifications />
          <SessionProvider>
            <NavBar />
            <div style={{ flex: 1 }}>{children}</div>
            <Footer />
          </SessionProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
