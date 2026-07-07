<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/** Expo'nun kendi push servisi — arkada APNs/FCM'e yönlendiriyor, Firebase Admin SDK'ya hiç gerek yok. */
class ExpoPushClient
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    /**
     * @param  array<int, string>  $Tokens
     * @param  array<string, mixed>  $Data
     */
    public function send(array $Tokens, string $Title, string $Body, array $Data = []): void
    {
        if ($Tokens === []) {
            return;
        }

        $Messages = array_map(fn (string $Token): array => [
            'to' => $Token,
            'title' => $Title,
            'body' => $Body,
            'data' => $Data,
            'sound' => 'default',
        ], $Tokens);

        try {
            Http::timeout(5)->post(self::ENDPOINT, $Messages);
        } catch (Throwable $Exception) {
            Log::warning('Expo push gönderilemedi.', ['error' => $Exception->getMessage()]);
        }
    }
}
