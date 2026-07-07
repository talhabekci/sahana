<?php

namespace App\Notifications\Channels;

use App\Models\User;

/** ExpoChannel üzerinden push atılacak her bildirim sınıfının uyması gereken sözleşme. */
interface ExpoNotification
{
    /** PlayerProfile::NOTIFICATION_CATEGORIES'ten biri. */
    public function expoCategory(): string;

    /** @return array{title: string, body: string, data?: array<string, mixed>} */
    public function toExpo(User $Notifiable): array;
}
