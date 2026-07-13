import { Stack } from 'expo-router';

import { useTheme } from '@/shared/ui/theme';

export default function AuthLayout() {
  const Palette = useTheme();

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
