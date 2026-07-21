<?php

namespace App\Notifications;

use App\Models\User;
use App\Notifications\Channels\ExpoChannel;
use App\Notifications\Channels\ExpoNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class FollowedNotification extends Notification implements ExpoNotification, ShouldQueue
{
    use Queueable;

    public function __construct(private readonly User $Follower) {}

    /** @return array<int, string> */
    public function via(object $Notifiable): array
    {
        return ['database', ExpoChannel::class];
    }

    /** @return array<string, mixed> */
    public function toArray(object $Notifiable): array
    {
        return [
            'follower_id' => $this->Follower->public_id,
            'follower_name' => $this->Follower->name,
        ];
    }

    public function expoCategory(): string
    {
        return 'followed';
    }

    /** @return array{title: string, body: string, data?: array<string, mixed>} */
    public function toExpo(User $Notifiable): array
    {
        return [
            'title' => 'Yeni takipçi',
            'body' => $this->Follower->name.' seni takip etmeye başladı.',
            'data' => ['follower_id' => $this->Follower->public_id, 'type' => 'followed'],
        ];
    }
}
