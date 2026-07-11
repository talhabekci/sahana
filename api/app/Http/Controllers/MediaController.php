<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Public disk medyasını HTTP Range destekli servis eder (BACKLOG #50).
 *
 * Video/ses oynatıcıları (iOS AVPlayer, Android ExoPlayer) medyayı Range
 * istekleriyle akıtır; PHP'nin yerleşik dev sunucusu statik dosyalarda
 * Range desteklemediğinden /storage/... URL'lerindeki video ve sesler
 * cihazda hiç oynatılamıyordu. Bu route dosyayı Laravel üzerinden
 * BinaryFileResponse ile döndürür — Symfony, Range başlığını kendisi
 * işler (206 Partial Content). Sunucudan bağımsız çalışır (dev'de php -S,
 * prod'da nginx/fpm).
 */
class MediaController extends Controller
{
    public function show(string $Path): BinaryFileResponse
    {
        // Yol kaçışı koruması: public disk kökü dışına çıkılamaz.
        if (str_contains($Path, '..')) {
            abort(404);
        }

        $Disk = Storage::disk('public');

        if (! $Disk->exists($Path)) {
            abort(404);
        }

        return response()->file($Disk->path($Path));
    }
}
