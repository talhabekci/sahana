<?php

namespace App\Actions\Chat;

use App\Events\MessageSent;
use App\Exceptions\ApiError;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use App\Models\User;
use App\Notifications\DirectMessageNotification;

class SendDirectMessage
{
    /**
     * @param  array{type: string, body?: string|null, image_path?: string|null, audio_path?: string|null, audio_duration?: int|null}  $Data
     * @return array<string, mixed>
     */
    public function handle(User $Sender, User $Recipient, array $Data): array
    {
        if ($Sender->id === $Recipient->id) {
            throw new ApiError('Kendine mesaj gönderemezsin.', 'validation_error', 422);
        }

        if ($Sender->isBlockedWith($Recipient)) {
            throw new ApiError('Bu kullanıcıyla mesajlaşamazsın.', 'not_found', 404);
        }

        $ParticipantIds = [$Sender->id, $Recipient->id];
        sort($ParticipantIds);

        $Message = Message::create([
            'participant_ids' => $ParticipantIds,
            'user_id' => $Sender->id,
            'type' => $Data['type'],
            'body' => $Data['body'] ?? null,
            'image_path' => $Data['image_path'] ?? null,
            'audio_path' => $Data['audio_path'] ?? null,
            'audio_duration' => $Data['audio_duration'] ?? null,
        ]);

        $Payload = MessageResource::shape($Message, $Sender);

        $PublicIds = [$Sender->public_id, $Recipient->public_id];
        sort($PublicIds);

        broadcast(new MessageSent("dm.{$PublicIds[0]}.{$PublicIds[1]}", $Payload))->toOthers();

        $Recipient->notify(new DirectMessageNotification($Sender, $Message));

        return $Payload;
    }
}
