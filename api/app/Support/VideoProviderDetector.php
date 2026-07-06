<?php

namespace App\Support;

class VideoProviderDetector
{
    /** URL host'una göre sağlayıcıyı sınıflandırır — Video::PROVIDERS'a uyar. */
    public static function detect(string $Url): string
    {
        $Host = mb_strtolower((string) parse_url($Url, PHP_URL_HOST));

        if ($Host === 'youtube.com' || str_ends_with($Host, '.youtube.com') || $Host === 'youtu.be') {
            return 'youtube';
        }

        if ($Host === 'sosyalhalisaha.com' || str_ends_with($Host, '.sosyalhalisaha.com')) {
            return 'sosyalhalisaha';
        }

        return 'other';
    }
}
