<?php

namespace App\Notifications;

use App\Models\ListingApplication;
use App\Models\User;
use App\Notifications\Channels\ExpoChannel;
use App\Notifications\Channels\ExpoNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ApplicationDecisionNotification extends Notification implements ExpoNotification, ShouldQueue
{
    use Queueable;

    public function __construct(private readonly ListingApplication $Application) {}

    /** @return array<int, string> */
    public function via(object $Notifiable): array
    {
        return ['database', ExpoChannel::class];
    }

    /** @return array<string, mixed> */
    public function toArray(object $Notifiable): array
    {
        return [
            'application_id' => $this->Application->public_id,
            'status' => $this->Application->status,
        ];
    }

    public function expoCategory(): string
    {
        return 'application_decision';
    }

    /** @return array{title: string, body: string, data?: array<string, mixed>} */
    public function toExpo(User $Notifiable): array
    {
        $Approved = $this->Application->status === 'approved';

        return [
            'title' => $Approved ? 'Başvurun onaylandı' : 'Başvurun reddedildi',
            'body' => $Approved
                ? 'Adam eksik ilanına başvurun kabul edildi, maça eklendin.'
                : 'Adam eksik ilanına başvurun bu sefer kabul edilmedi.',
            'data' => ['application_id' => $this->Application->public_id, 'type' => 'application_decision'],
        ];
    }
}
