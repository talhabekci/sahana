import Echo from 'laravel-echo';
import PusherModule from 'pusher-js';

import { Api } from './client';

// pusher-js'in react-native derlemesi `module.exports.Pusher = ...` ile
// isimli export veriyor (default/__esModule yok) — Metro'nun CJS interop'u
// bu yüzden default import'u sınıfın kendisi yerine { Pusher: Sınıf }
// sarmalayıcısına çeviriyor. İkisini de destekleyecek şekilde çözülüyor.
const PusherClass = ((PusherModule as unknown as { Pusher?: typeof PusherModule }).Pusher ??
  PusherModule) as typeof PusherModule;

// pusher-js 'window.Pusher' bekliyor; RN'de window genelde global'e eşit ama
// garantiye almak için elle atanıyor.
(global as unknown as { Pusher: typeof PusherModule }).Pusher = PusherClass;

let EchoInstance: Echo<'reverb'> | null = null;

/** Tek bir Echo örneği — Sanctum bearer token'ı kendi Api istemcimizle enjekte eder. */
export function getEcho(): Echo<'reverb'> {
  if (EchoInstance != null) {
    return EchoInstance;
  }

  EchoInstance = new Echo({
    broadcaster: 'reverb',
    key: process.env.EXPO_PUBLIC_REVERB_APP_KEY ?? '',
    wsHost: process.env.EXPO_PUBLIC_REVERB_HOST ?? '127.0.0.1',
    wsPort: Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 8080),
    wssPort: Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 8080),
    forceTLS: (process.env.EXPO_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel: { name: string }) => ({
      authorize: (
        socketId: string,
        callback: (error: Error | null, authData: { auth: string } | null) => void,
      ) => {
        // Api'nin baseURL'i zaten /api/v1 içeriyor — /broadcasting/auth göreli yeterli.
        Api.post('/broadcasting/auth', {
          socket_id: socketId,
          channel_name: channel.name,
        })
          .then((Response) => callback(null, Response.data))
          .catch((Error_) => callback(Error_ instanceof Error ? Error_ : new Error(String(Error_)), null));
      },
    }),
  });

  return EchoInstance;
}

export function disconnectEcho(): void {
  EchoInstance?.disconnect();
  EchoInstance = null;
}
