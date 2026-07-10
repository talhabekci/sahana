<?php

namespace App\Support;

use App\Exceptions\ApiError;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Kullanıcı görsel yüklemelerinin ortak güvenlik hattı: gerçek içerik
 * doğrulama (sahte uzantı/bozuk dosya reddi — GD ile decode edilmeye
 * çalışılır), EXIF/GPS metadata temizliği için her zaman JPEG'e yeniden
 * encode, rastgele dosya adı (path traversal / üzerine yazma riski yok).
 * Bkz. docs/features/04-social-feed.md.
 */
class ImageUploader
{
    public static function store(UploadedFile $Image, string $Directory): string
    {
        $Resource = @imagecreatefromstring(file_get_contents($Image->getRealPath()));

        if ($Resource === false) {
            throw new ApiError('Desteklenmeyen ya da bozuk görsel dosyası.', 'invalid_image', 422);
        }

        ob_start();
        imagejpeg($Resource, quality: 85);
        $JpegContents = ob_get_clean();
        imagedestroy($Resource);

        $Path = $Directory.'/'.Str::uuid().'.jpg';
        Storage::disk('public')->put($Path, $JpegContents);

        return $Path;
    }

    /** Resource'larda depolanan yolu (ör. `avatar_path`) tam bir genel URL'e çevirir. */
    public static function url(?string $Path): ?string
    {
        return $Path !== null ? Storage::disk('public')->url($Path) : null;
    }
}
