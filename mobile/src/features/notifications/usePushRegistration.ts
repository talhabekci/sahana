import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { isViewingChat } from './activeChatContext';
import { registerDevice } from './api';

Notifications.setNotificationHandler({
  handleNotification: async (Notification) => {
    const Data = Notification.request.content.data as Record<string, unknown>;
    // Sohbet mesajı zaten açık olan ekranda canlı göründüğü için, o ekrandaysak
    // push'u ayrıca göstermeye gerek yok (BACKLOG #67).
    const Suppress = Data?.type === 'chat_message' && isViewingChat(Data);

    return {
      shouldShowBanner: !Suppress,
      shouldShowList: !Suppress,
      shouldPlaySound: !Suppress,
      shouldSetBadge: false,
    };
  },
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
