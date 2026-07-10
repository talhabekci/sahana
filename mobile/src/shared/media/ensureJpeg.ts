import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Seçilen/çekilen görseli yüklemeden önce her zaman gerçek JPEG'e
 * dönüştürür — iOS'ta kamera/galeri çıktısı varsayılan olarak HEIC
 * olabilir, sunucudaki GD kurulumu HEIC decode edemediğinden bu, "bozuk
 * görsel" hatalarının kök nedeniydi (bkz. BACKLOG.md #34, #35). Hiçbir
 * kırpma/resize yapmaz, sadece format garantisi verir.
 */
export async function ensureJpeg(uri: string): Promise<{ uri: string; name: string; type: string }> {
  const Result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return { uri: Result.uri, name: 'photo.jpg', type: 'image/jpeg' };
}
