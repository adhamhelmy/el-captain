import './globals.css';
import type { Metadata } from 'next';
import { Bebas_Neue, Space_Grotesk } from 'next/font/google';
import { SessionProvider } from '@/components/SessionProvider';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' });
const space = Space_Grotesk({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-space',
});

export const metadata: Metadata = {
  title: { default: 'El Captain', template: '%s | El Captain' },
  description:
    'Find and book group sessions and 1:1 coaching — yoga, HIIT, spin, strength and more.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' className={`${bebas.variable} ${space.variable}`}>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
