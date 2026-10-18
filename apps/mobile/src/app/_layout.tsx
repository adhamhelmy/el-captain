import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Cairo_500Medium, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { IntlProvider } from '@/i18n/IntlProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { NoticeBanner } from '@/ui/NoticeBanner';

SplashScreen.preventAutoHideAsync();

function Root({ fontsReady }: { fontsReady: boolean }) {
  const { scheme, colors } = useTheme();
  const { status } = useAuth();
  const ready = fontsReady && status === 'ready';

  // The splash stays up until fonts are loaded and the saved sign-in is checked, so nothing flashes.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
      <NoticeBanner />
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BebasNeue_400Regular,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Cairo_500Medium,
    Cairo_700Bold,
  });

  return (
    <ThemeProvider>
      <IntlProvider>
        <AuthProvider>
          <Root fontsReady={loaded || !!error} />
        </AuthProvider>
      </IntlProvider>
    </ThemeProvider>
  );
}
