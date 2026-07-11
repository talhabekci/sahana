import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Alert, Share } from 'react-native';

/**
 * İlan paylaşım linki (BACKLOG #33) — takım davet linkiyle aynı desen:
 * uygulama şemasıyla deep-link üretilir; linke tıklayan kullanıcı ilgili
 * ilan ekranına düşer (girişsizse önce auth'a yönlenir).
 */
export function shareListing(kind: 'player' | 'opponent', listingId: string): void {
  const Url = Linking.createURL(
    kind === 'player' ? `listing/${listingId}` : `opponent-listing/${listingId}`,
  );

  Alert.alert('İlanı paylaş', undefined, [
    { text: 'Vazgeç', style: 'cancel' },
    {
      text: 'Linki kopyala',
      onPress: () => {
        void Clipboard.setStringAsync(Url);
      },
    },
    {
      text: 'Paylaş…',
      onPress: () => {
        void Share.share({ message: Url });
      },
    },
  ]);
}
