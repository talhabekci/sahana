import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { AnimatedTabBar } from '@/shared/ui/AnimatedTabBar';
import { Palette } from '@/shared/ui/theme';

export default function TabsLayout() {
  return (
    <Tabs
      // Animasyonlu pill sekme çubuğu (BACKLOG #59): varsayılan ikon+etiket
      // render'ı yerine özel `tabBar`, BACKLOG #43'teki liquid glass zemini
      // kendi içinde korur.
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Palette.pitchNight },
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Akış',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'newspaper' : 'newspaper-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Maçlar',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'football' : 'football-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Takımlar',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'shield' : 'shield-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="conversations"
        options={{
          title: 'Sohbet',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
