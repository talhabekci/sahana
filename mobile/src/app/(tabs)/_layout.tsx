import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { GlassView } from '@/shared/ui/GlassView';
import { Palette, Type } from '@/shared/ui/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Liquid glass tab bar (BACKLOG #43): bar saydam + absolute, içerik
        // altından akar; arka plan GlassView (expo-blur) ile buzlu cam.
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopColor: Palette.lineFaint,
          elevation: 0,
        },
        tabBarBackground: () => <GlassView style={StyleSheet.absoluteFillObject} intensity={60} />,
        tabBarActiveTintColor: Palette.lime,
        tabBarInactiveTintColor: Palette.moss,
        tabBarLabelStyle: {
          fontFamily: Type.bodyMedium,
          fontSize: 11,
        },
        sceneStyle: { backgroundColor: Palette.pitchNight },
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Akış',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />
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
        name="conversations"
        options={{
          title: 'Sohbet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
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
