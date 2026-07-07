<?php

namespace App\Notifications;

use App\Models\User;
use App\Notifications\Channels\ExpoChannel;
use App\Notifications\Channels\ExpoNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class SocialSummaryNotification extends Notification implements ExpoNotification, ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly int $LikesCount,
        private readonly int $CommentsCount,
        private readonly int $NewFollowersCount,
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
            'likes_count' => $this->LikesCount,
            'comments_count' => $this->CommentsCount,
            'new_followers_count' => $this->NewFollowersCount,
        ];
    }

    public function expoCategory(): string
    {
        return 'social_summary';
    }

    /** @return array{title: string, body: string, data?: array<string, mixed>} */
    public function toExpo(User $Notifiable): array
    {
        $Parts = array_filter([
            $this->LikesCount > 0 ? "{$this->LikesCount} beğeni" : null,
            $this->CommentsCount > 0 ? "{$this->CommentsCount} yorum" : null,
            $this->NewFollowersCount > 0 ? "{$this->NewFollowersCount} yeni takipçi" : null,
        ]);

        return [
            'title' => 'Akışında hareket var',
            'body' => implode(' · ', $Parts),
            'data' => ['type' => 'social_summary'],
        ];
    }
}
