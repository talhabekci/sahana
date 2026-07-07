import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { registerDevice } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Expo Go, SDK 53'ten beri uzak push'u desteklemiyor — bu hook sadece bir
 * development build/standalone uygulamada gerçek bir token üretir; Expo Go'da
 * sessizce hiçbir şey yapmaz (hata fırlatmaz).
 */
export function usePushRegistration(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !Device.isDevice) {
      return;
    }

    void (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const Existing = await Notifications.getPermissionsAsync();
      let Status = Existing.status;

      if (Status !== 'granted') {
        const Requested = await Notifications.requestPermissionsAsync();
        Status = Requested.status;
      }

      if (Status !== 'granted') {
        return;
      }

      const ProjectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

      try {
        const { data: Token } = await Notifications.getExpoPushTokenAsync(
          ProjectId != null ? { projectId: ProjectId } : undefined,
        );

        await registerDevice({
          expo_push_token: Token,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
        });
      } catch {
        // Expo Go'da (SDK 53+) ya da EAS projectId henüz kurulmadıysa burada
        // sessizce vazgeçilir — development build'e geçilince çalışır.
      }
    })();
  }, [enabled]);
}
