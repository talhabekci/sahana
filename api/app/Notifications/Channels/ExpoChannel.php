<?php

namespace App\Notifications\Channels;

use App\Jobs\SendExpoPush;
use App\Models\User;
use App\Support\QuietHours;
use Illuminate\Notifications\Notification;

class ExpoChannel
{
    /** Sessiz saat kuralına tabi olmayan kategoriler (anlık/isteğe bağlı kanallar). */
    private const BYPASSES_QUIET_HOURS = ['chat_message'];

    public function send(User $Notifiable, Notification $Notification): void
    {
        if (! $Notification instanceof ExpoNotification) {
            return;
        }

        $Profile = $Notifiable->profile;

        if ($Profile !== null && ! $Profile->wantsNotification($Notification->expoCategory())) {
            return;
        }

        $Tokens = $Notifiable->devices()->pluck('expo_push_token')->all();

        if ($Tokens === []) {
            return;
        }

        $Payload = $Notification->toExpo($Notifiable);
        $Delayed = $Profile?->quiet_hours_enabled === true
            && ! in_array($Notification->expoCategory(), self::BYPASSES_QUIET_HOURS, true)
            && QuietHours::isQuietNow();

        if ($Delayed) {
            SendExpoPush::dispatch($Tokens, $Payload['title'], $Payload['body'], $Payload['data'] ?? [])
                ->delay(QuietHours::nextWindowEnd());

            return;
        }

        SendExpoPush::dispatch($Tokens, $Payload['title'], $Payload['body'], $Payload['data'] ?? []);
    }
}
