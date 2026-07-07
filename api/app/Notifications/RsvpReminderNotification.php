<?php

namespace App\Notifications;

use App\Models\FootballMatch;
use App\Models\User;
use App\Notifications\Channels\ExpoChannel;
use App\Notifications\Channels\ExpoNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class RsvpReminderNotification extends Notification implements ExpoNotification, ShouldQueue
{
    use Queueable;

    public function __construct(private readonly FootballMatch $Match) {}

    /** @return array<int, string> */
    public function via(object $Notifiable): array
    {
        return ['database', ExpoChannel::class];
    }

    /** @return array<string, mixed> */
    public function toArray(object $Notifiable): array
    {
        return [
            'match_id' => $this->Match->public_id,
            'venue_text' => $this->Match->venue_text,
            'starts_at' => $this->Match->starts_at->toIso8601String(),
        ];
    }

    public function expoCategory(): string
    {
        return 'rsvp_reminder';
    }

    /** @return array{title: string, body: string, data?: array<string, mixed>} */
    public function toExpo(User $Notifiable): array
    {
        return [
            'title' => 'Geliyor musun?',
            'body' => $this->Match->venue_text.' maçına henüz yanıt vermedin — yarın oynanıyor.',
            'data' => ['match_id' => $this->Match->public_id, 'type' => 'rsvp_reminder'],
        ];
    }
}
