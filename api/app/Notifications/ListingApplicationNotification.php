<?php

namespace App\Notifications;

use App\Models\ListingApplication;
use App\Models\User;
use App\Notifications\Channels\ExpoChannel;
use App\Notifications\Channels\ExpoNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class ListingApplicationNotification extends Notification implements ExpoNotification, ShouldQueue
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
            'listing_id' => $this->Application->listing->public_id,
            'applicant_name' => $this->Application->user->name,
        ];
    }

    public function expoCategory(): string
    {
        return 'listing_application';
    }

    /** @return array{title: string, body: string, data?: array<string, mixed>} */
    public function toExpo(User $Notifiable): array
    {
        return [
            'title' => 'Yeni başvuru',
            'body' => ($this->Application->user->name ?? 'Bir oyuncu').' adam eksik ilanına başvurdu.',
            'data' => ['listing_id' => $this->Application->listing->public_id, 'type' => 'listing_application'],
        ];
    }
}
