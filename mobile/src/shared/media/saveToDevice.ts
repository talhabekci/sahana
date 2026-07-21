import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

/** BACKLOG #74 — akış/sohbetteki bir görseli cihazın galerisine indirir. */
export async function saveToDevice(RemoteUrl: string): Promise<void> {
  const Permission = await MediaLibrary.requestPermissionsAsync();

  if (!Permission.granted) {
    Alert.alert('İzin gerekli', 'Fotoğrafı kaydetmek için galeri erişim izni vermen gerekiyor.');

    return;
  }

  try {
    const Extension = RemoteUrl.split('.').pop()?.split('?')[0] ?? 'jpg';
    const LocalUri = `${FileSystem.cacheDirectory}sahana-${Date.now()}.${Extension}`;
    const { uri } = await FileSystem.downloadAsync(RemoteUrl, LocalUri);

    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('Kaydedildi', 'Fotoğraf galerine kaydedildi.');
  } catch {
    Alert.alert('Olmadı', 'Fotoğraf kaydedilirken bir sorun oluştu.');
  }
}
