import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { Manrope_400Regular, Manrope_500Medium, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAuthStore } from '@/features/auth/store';
import { Palette } from '@/shared/ui/theme';

SplashScreen.preventAutoHideAsync();

const Client = new QueryClient();

export default function RootLayout() {
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
  const Segments = useSegments();
  const Router = useRouter();

  useEffect(() => {
    void Hydrate();
  }, [Hydrate]);

  const Ready = FontsLoaded && Hydrated;

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

    void SplashScreen.hideAsync();
  }, [Ready, Token, Segments, Router]);

  if (!Ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={Client}>
        <StatusBar style="light" />
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
