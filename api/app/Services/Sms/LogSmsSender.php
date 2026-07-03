<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Log;

/**
 * Sağlayıcı (Netgsm/İleti Merkezi) seçilene dek SMS'leri log'a yazar.
 * Spec: docs/features/01-auth-profile.md — açık soru.
 */
class LogSmsSender implements SmsSender
{
    public function send(string $Phone, string $Message): void
    {
        Log::info('SMS (log driver)', ['phone' => $Phone, 'message' => $Message]);
    }
}
