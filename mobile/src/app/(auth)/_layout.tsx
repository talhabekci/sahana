import { Stack } from 'expo-router';

import { Palette } from '@/shared/ui/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: Palette.pitchNight },
      }}
    />
  );
}
