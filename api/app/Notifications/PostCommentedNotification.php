<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Notifications\Channels\ExpoChannel;
use App\Notifications\Channels\ExpoNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class PostCommentedNotification extends Notification implements ExpoNotification, ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Post $Post,
        private readonly Comment $Comment,
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
            'commenter_id' => $this->Comment->user->public_id,
            'commenter_name' => $this->Comment->user->name,
            'comment_body' => Str::limit($this->Comment->body, 80),
        ];
    }

    public function expoCategory(): string
    {
        return 'post_commented';
    }

    /** @return array{title: string, body: string, data?: array<string, mixed>} */
    public function toExpo(User $Notifiable): array
    {
        return [
            'title' => 'Yeni yorum',
            'body' => $this->Comment->user->name.': '.Str::limit($this->Comment->body, 80),
            'data' => ['post_id' => $this->Post->public_id, 'type' => 'post_commented'],
        ];
    }
}
