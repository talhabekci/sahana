import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Uzun kenar sınırı: avatar/arma/gönderi/sohbet görselleri için fazlasıyla
 * yeterli çözünürlük; dosyaları ~200-600KB'a düşürerek sunucu upload
 * limitlerine (PHP upload_max_filesize dahil) takılmayı kökten önler
 * (bkz. BACKLOG.md #40, #41).
 */
const MAX_EDGE = 1600;

/**
 * Seçilen/çekilen görseli yüklemeden önce her zaman gerçek JPEG'e dönüştürür
 * ve uzun kenarı MAX_EDGE'i aşıyorsa küçültür.
 * - JPEG garantisi: iOS'ta kamera/galeri çıktısı varsayılan olarak HEIC
 *   olabilir, sunucudaki GD kurulumu HEIC decode edemez (BACKLOG #34, #35).
 * - Boyut sınırı: tam çözünürlüklü telefon fotoğrafı JPEG'e çevrilince de
 *   birkaç MB olabiliyor; PHP'nin upload limitine takılıp "Doğrulama
 *   hatası"na yol açıyordu (BACKLOG #40, #41).
 *
 * `size` görselin orijinal boyutlarıdır (ImagePicker asset'i sağlar);
 * verilmezse resize atlanır, sadece format dönüşümü yapılır.
 */
export async function ensureJpeg(
  uri: string,
  size?: { width?: number; height?: number },
): Promise<{ uri: string; name: string; type: string }> {
  const Actions: ImageManipulator.Action[] = [];
  const Width = size?.width ?? 0;
  const Height = size?.height ?? 0;
  const LongEdge = Math.max(Width, Height);

  if (LongEdge > MAX_EDGE) {
    const Scale = MAX_EDGE / LongEdge;
    Actions.push({
      resize: { width: Math.round(Width * Scale), height: Math.round(Height * Scale) },
    });
  }

  const Result = await ImageManipulator.manipulateAsync(uri, Actions, {
    compress: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return { uri: Result.uri, name: 'photo.jpg', type: 'image/jpeg' };
}
