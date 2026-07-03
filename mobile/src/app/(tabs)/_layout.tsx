import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { Palette, Type } from '@/shared/ui/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Palette.turf,
          borderTopColor: Palette.lineFaint,
        },
        tabBarActiveTintColor: Palette.lime,
        tabBarInactiveTintColor: Palette.moss,
        tabBarLabelStyle: {
          fontFamily: Type.bodyMedium,
          fontSize: 11,
        },
        sceneStyle: { backgroundColor: Palette.pitchNight },
      }}>
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Maçlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="football-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Takımlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
