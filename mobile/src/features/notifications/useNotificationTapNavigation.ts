import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { routeFor } from './routeFor';

/**
 * Bir push bildirimine dokununca (uygulama arka plandayken/canlıyken VEYA
 * tamamen kapalıyken — soğuk başlangıç) ilgili sayfaya gider (BACKLOG #79).
 * Uygulama içi bildirimler listesindeki tıklama zaten kendi ekranında
 * (`notifications/index.tsx`) ele alınıyor — bu hook sadece dışarıdan
 * (kilit ekranı/bildirim merkezi) gelen dokunuşlar için.
 */
export function useNotificationTapNavigation(Ready: boolean): void {
  const Router = useRouter();

  useEffect(() => {
    if (!Ready) {
      return;
    }

    function navigate(Data: Record<string, unknown>) {
      const Type = typeof Data.type === 'string' ? Data.type : null;

      if (Type == null) {
        return;
      }

      const Route = routeFor(Type, Data);

      if (Route != null) {
        Router.push(Route as never);
      }
    }

    // Soğuk başlangıç: uygulama kapalıyken bildirime dokunulup açıldıysa.
    void Notifications.getLastNotificationResponseAsync().then((Response) => {
      if (Response != null) {
        navigate(Response.notification.request.content.data as Record<string, unknown>);
      }
    });

    // Uygulama arka plandayken/canlıyken bir bildirime dokunulursa.
    const Subscription = Notifications.addNotificationResponseReceivedListener((Response) => {
      navigate(Response.notification.request.content.data as Record<string, unknown>);
    });

    return () => Subscription.remove();
  }, [Ready, Router]);
}
