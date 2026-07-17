import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { Manrope_400Regular, Manrope_500Medium, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import * as Sentry from '@sentry/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuthStore } from '@/features/auth/store';
import { usePushRegistration } from '@/features/notifications/usePushRegistration';
import { useThemeStore } from '@/features/settings/themeStore';
import { AnimatedSplash } from '@/shared/ui/AnimatedSplash';
import { useIsDarkTheme, useTheme } from '@/shared/ui/theme';

SplashScreen.preventAutoHideAsync();

// PRODUCTION-READINESS.md §E — DSN yoksa SDK sessizce devre dışı kalır
// (dev'de EXPO_PUBLIC_SENTRY_DSN .env'e eklenmediği sürece kapalı).
const SentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
Sentry.init({
  dsn: SentryDsn != null && SentryDsn !== '' ? SentryDsn : undefined,
  enabled: SentryDsn != null && SentryDsn !== '',
  sendDefaultPii: false,
  tracesSampleRate: 1.0,
  enableLogs: true,
});

const Client = new QueryClient();

function RootLayout() {
  const [FontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_700Bold,
    SpaceMono_700Bold,
  });

  const Token = useAuthStore((State) => State.token);
  const Hydrated = useAuthStore((State) => State.hydrated);
  const Hydrate = useAuthStore((State) => State.hydrate);
  const ThemeHydrated = useThemeStore((State) => State.hydrated);
  const HydrateTheme = useThemeStore((State) => State.hydrate);
  const Segments = useSegments();
  const Router = useRouter();
  const Palette = useTheme();
  const IsDark = useIsDarkTheme();

  useEffect(() => {
    void Hydrate();
    void HydrateTheme();
  }, [Hydrate, HydrateTheme]);

  const Ready = FontsLoaded && Hydrated && ThemeHydrated;
  const [AnimationDone, setAnimationDone] = useState(false);

  usePushRegistration(Ready && Token != null);

  // Splash yalnızca Ready ilk true olduğunda bir kez gizlenir — her rota
  // değişiminde (Segments) tekrar çağrılırsa native taraf reddediyor
  // ("No native splash screen registered for given view controller").
  // Native (statik) splash kapanır kapanmaz aynı marka görseliyle devam eden
  // JS animasyonu (AnimatedSplash) devreye giriyor — bkz. BACKLOG.md #22.
  useEffect(() => {
    if (Ready) {
      void SplashScreen.hideAsync();
    }
  }, [Ready]);

  useEffect(() => {
    if (!Ready) {
      return;
    }

    const SegmentPath = Segments.join('/');
    const InAuthGroup = SegmentPath.startsWith('(auth)');
    const InOnboarding = SegmentPath === '(auth)/onboarding';

    if (Token == null && !InAuthGroup) {
      Router.replace('/(auth)/welcome');
    } else if (Token != null && InAuthGroup && !InOnboarding) {
      Router.replace('/(tabs)/profile');
    }
  }, [Ready, Token, Segments, Router]);

  if (!AnimationDone) {
    return <AnimatedSplash ready={Ready} onFinish={() => setAnimationDone(true)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={Client}>
        <StatusBar style={IsDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Palette.pitchNight },
          }}
        />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
