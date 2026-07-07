<?php

namespace App\Notifications;

use App\Models\Message;
use App\Models\Team;
use App\Models\User;
use App\Notifications\Channels\ExpoChannel;
use App\Notifications\Channels\ExpoNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Sadece push — sohbetin kendi ekranı/geçmişi olduğundan bildirim merkezine
 * (database channel) düşmez, WhatsApp'ın kendisi gibi.
 */
class ChatMessageNotification extends Notification implements ExpoNotification, ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly Team $Team,
        private readonly User $Sender,
        private readonly Message $Message,
    ) {}

    /** @return array<int, string> */
    public function via(object $Notifiable): array
    {
        return [ExpoChannel::class];
    }

    public function expoCategory(): string
    {
        return 'chat_message';
    }

    /** @return array{title: string, body: string, data?: array<string, mixed>} */
    public function toExpo(User $Notifiable): array
    {
        $Preview = $this->Message->type === 'text'
            ? (string) $this->Message->body
            : match ($this->Message->type) {
                'image' => '📷 Fotoğraf',
                'match_ref' => '⚽ Maç paylaştı',
                'lineup_ref' => '📋 Kadro paylaştı',
                default => 'Yeni mesaj',
            };

        return [
            'title' => $this->Team->name.' · '.($this->Sender->name ?? 'Bir oyuncu'),
            'body' => $Preview,
            'data' => ['team_id' => $this->Team->public_id, 'type' => 'chat_message'],
        ];
    }
}
