import './globals.css';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import { Bebas_Neue, Cairo, Space_Grotesk } from 'next/font/google';
import { SessionProvider } from '@/components/SessionProvider';
import { appLocale } from '@/i18n/locale';
import { themeInitScript } from '@/lib/theme';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' });
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' });
const space = Space_Grotesk({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-space',
});

/** First family only: next/font's metric fallback is local Arial, which has Arabic glyphs and would hide Cairo. */
const primary = (font: { style: { fontFamily: string } }) => font.style.fontFamily.split(',')[0];
const ARABIC_FONTS = {
  '--font-display': `${primary(bebas)}, ${cairo.style.fontFamily}, sans-serif`,
  '--font-ui': `${primary(space)}, ${cairo.style.fontFamily}, sans-serif`,
} as React.CSSProperties;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meta');
  return { title: { default: t('title'), template: t('template') }, description: t('description') };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const lang = appLocale(await getLocale());
  return (
    // The init script sets data-theme before hydration, so the attribute can differ from the server render.
    <html
      lang={lang}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`${bebas.variable} ${space.variable} ${cairo.variable}`}
      style={lang === 'ar' ? ARABIC_FONTS : undefined}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <SessionProvider>{children}</SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
