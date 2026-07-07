<?php

namespace App\Notifications;

use App\Models\Team;
use App\Models\User;
use App\Notifications\Channels\ExpoChannel;
use App\Notifications\Channels\ExpoNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class InviteAcceptedNotification extends Notification implements ExpoNotification, ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Team $Team,
        private readonly User $NewMember,
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
            'team_id' => $this->Team->public_id,
            'new_member_name' => $this->NewMember->name,
        ];
    }

    public function expoCategory(): string
    {
        return 'invite_accepted';
    }

    /** @return array{title: string, body: string, data?: array<string, mixed>} */
    public function toExpo(User $Notifiable): array
    {
        return [
            'title' => 'Yeni üye katıldı',
            'body' => ($this->NewMember->name ?? 'Bir oyuncu').' davetini kabul edip '.$this->Team->name.' takımına katıldı.',
            'data' => ['team_id' => $this->Team->public_id, 'type' => 'invite_accepted'],
        ];
    }
}
