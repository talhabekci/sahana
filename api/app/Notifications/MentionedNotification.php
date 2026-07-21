<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\User;
use App\Notifications\Channels\ExpoChannel;
use App\Notifications\Channels\ExpoNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class MentionedNotification extends Notification implements ExpoNotification, ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Post $Post,
        private readonly User $Mentioner,
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
            'mentioner_id' => $this->Mentioner->public_id,
            'mentioner_name' => $this->Mentioner->name,
        ];
    }

    public function expoCategory(): string
    {
        return 'mentioned';
    }

    /** @return array{title: string, body: string, data?: array<string, mixed>} */
    public function toExpo(User $Notifiable): array
    {
        return [
            'title' => 'Bir gönderide etiketlendin',
            'body' => $this->Mentioner->name.' seni bir gönderide/yorumda etiketledi.',
            'data' => ['post_id' => $this->Post->public_id, 'type' => 'mentioned'],
        ];
    }
}
