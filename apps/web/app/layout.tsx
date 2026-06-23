import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { MantineProvider, ColorSchemeScript } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { SessionProvider } from '@/components/SessionProvider'
import { NavBar } from '@/components/NavBar'

export const metadata = { title: 'El Captain', description: 'Find and book fitness classes' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <Notifications />
          <SessionProvider>
            <NavBar />
            {children}
          </SessionProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
