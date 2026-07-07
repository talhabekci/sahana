<?php

namespace App\Notifications;

use App\Models\Message;
use App\Models\User;
use App\Notifications\Channels\ExpoChannel;
use App\Notifications\Channels\ExpoNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Sadece push — ChatMessageNotification'ın DM karşılığı, aynı sebeple
 * bildirim merkezine düşmez (sohbetin kendi ekranı/geçmişi var).
 */
class DirectMessageNotification extends Notification implements ExpoNotification, ShouldQueue
{
    use Queueable;

    public function __construct(
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
                default => 'Yeni mesaj',
            };

        return [
            'title' => $this->Sender->name ?? 'Bir oyuncu',
            'body' => $Preview,
            'data' => ['dm_user_id' => $this->Sender->public_id, 'type' => 'chat_message'],
        ];
    }
}
