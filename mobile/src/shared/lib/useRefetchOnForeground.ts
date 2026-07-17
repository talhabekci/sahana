import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Ekran fokuslandığında (sekmeler arası geçiş) VE uygulama arka plandan öne
 * gelirken (yalnızca bu ekran o an görünürse) verilen callback'i çağırır.
 *
 * TanStack Query'nin `refetchOnWindowFocus`'u RN'de global bir `focusManager`
 * sinyaline bağlı — tetiklenince mount'lu TÜM sorguları (Expo Router'ın alt
 * sekmeleri arka planda mount'lu tuttuğu için = tüm sekmeler) birden
 * yeniliyordu. Bu hook, her ekranın sadece kendi görünür olduğu anda
 * tetiklenmesini sağlıyor (bkz. PROGRESS.md 2026-07-17).
 *
 * `onRefetch` her render'da farklı bir referans olabilir (ör. queryKey'e göre
 * değişen `refetch`) — bir ref'te tutulup her çağrıda en güncel hâli
 * okunuyor, böylece alttaki focus/AppState aboneliklerinin yeniden
 * kurulmasına gerek kalmıyor ve çağıran tarafın `useCallback` sarmalamasına
 * ihtiyacı olmuyor.
 */
export function useRefetchOnForeground(onRefetch: () => void): void {
  const IsFocusedRef = useRef(false);
  const OnRefetchRef = useRef(onRefetch);
  OnRefetchRef.current = onRefetch;

  useFocusEffect(
    useCallback(() => {
      IsFocusedRef.current = true;
      OnRefetchRef.current();

      return () => {
        IsFocusedRef.current = false;
      };
    }, []),
  );

  useEffect(() => {
    const Subscription = AppState.addEventListener('change', (Status: AppStateStatus) => {
      if (Status === 'active' && IsFocusedRef.current) {
        OnRefetchRef.current();
      }
    });

    return () => Subscription.remove();
  }, []);
}
