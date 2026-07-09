<?php

namespace App\Notifications;

use App\Models\OpponentListing;
use App\Models\Team;
use App\Models\User;
use App\Notifications\Channels\ExpoChannel;
use App\Notifications\Channels\ExpoNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class OpponentFoundNotification extends Notification implements ExpoNotification, ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly OpponentListing $Listing,
        private readonly Team $OpponentTeam,
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
            'listing_id' => $this->Listing->public_id,
            'opponent_team_id' => $this->OpponentTeam->public_id,
            'opponent_team_name' => $this->OpponentTeam->name,
        ];
    }

    public function expoCategory(): string
    {
        return 'opponent_found';
    }

    /** @return array{title: string, body: string, data?: array<string, mixed>} */
    public function toExpo(User $Notifiable): array
    {
        return [
            'title' => 'Rakip bulundu!',
            'body' => $this->OpponentTeam->name.' takımı rakip ilanını kabul etti.',
            'data' => ['listing_id' => $this->Listing->public_id, 'type' => 'opponent_found'],
        ];
    }
}
