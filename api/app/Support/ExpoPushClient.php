<?php

namespace App\Support;

use App\Models\Device;
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
            $Response = Http::timeout(5)->post(self::ENDPOINT, $Messages);
            $this->logTicketErrors($Tokens, $Response->json('data', []));
        } catch (Throwable $Exception) {
            Log::warning('Expo push gönderilemedi.', ['error' => $Exception->getMessage()]);
        }
    }

    /**
     * Expo, ağ seviyesinde 200 dönse bile her mesaj için ayrı bir
     * "ticket" (status: ok|error) döner — bunu okumazsak push'lar
     * sessizce başarısız olur (bkz. BACKLOG.md #17).
     *
     * @param  array<int, string>  $Tokens
     * @param  array<int, array<string, mixed>>  $Tickets
     */
    private function logTicketErrors(array $Tokens, array $Tickets): void
    {
        foreach ($Tickets as $Index => $Ticket) {
            if (($Ticket['status'] ?? null) !== 'error') {
                continue;
            }

            $Token = $Tokens[$Index] ?? null;
            $ErrorCode = $Ticket['details']['error'] ?? null;

            Log::warning('Expo push reddedildi.', [
                'token' => $Token,
                'message' => $Ticket['message'] ?? null,
                'error' => $ErrorCode,
            ]);

            if ($ErrorCode === 'DeviceNotRegistered' && $Token !== null) {
                Device::where('expo_push_token', $Token)->delete();
            }
        }
    }
}
