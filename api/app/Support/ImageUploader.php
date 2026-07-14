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
        Storage::disk(config('filesystems.media_disk'))->put($Path, $JpegContents);

        return $Path;
    }

    /**
     * Resource'larda depolanan yolu (ör. `avatar_path`) tam bir genel URL'e çevirir.
     *
     * Media disk local 'public' ise /storage/... (statik symlink) yerine Range
     * destekli /media/... route'u kullanılır (BACKLOG #50): PHP'nin dev sunucusu
     * statikte Range desteklemez, video/ses oynatıcıları (AVPlayer/ExoPlayer)
     * Range olmadan akıtamaz. Uzak bir disk (R2/S3) ise diskin kendi genel
     * URL'i döner — Cloudflare/S3 Range'i zaten native destekler, PHP'yi
     * araya sokmaya gerek yok (PRODUCTION-READINESS.md §C).
     */
    public static function url(?string $Path): ?string
    {
        if ($Path === null) {
            return null;
        }

        $MediaDisk = config('filesystems.media_disk');

        if ($MediaDisk === 'public') {
            return url('media/'.ltrim($Path, '/'));
        }

        return Storage::disk($MediaDisk)->url($Path);
    }
}
