<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\User;
use App\Notifications\Channels\ExpoChannel;
use App\Notifications\Channels\ExpoNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PostLikedNotification extends Notification implements ExpoNotification, ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Post $Post,
        private readonly User $Liker,
    ) {}

    /** @return array<int, string> */
    public function via(object $Notifiable): array
    {
        return ['database', ExpoChannel::class];
    }

    /** @return array<string, mixed> */
    public function toArray(object $Notifiable): array
    {
        return [
            'post_id' => $this->Post->public_id,
            'liker_id' => $this->Liker->public_id,
            'liker_name' => $this->Liker->name,
        ];
    }

    public function expoCategory(): string
    {
        return 'post_liked';
    }

    /** @return array{title: string, body: string, data?: array<string, mixed>} */
    public function toExpo(User $Notifiable): array
    {
        return [
            'title' => 'Gönderin beğenildi',
            'body' => $this->Liker->name.' gönderini beğendi.',
            'data' => ['post_id' => $this->Post->public_id, 'type' => 'post_liked'],
        ];
    }
}
