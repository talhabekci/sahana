<?php

namespace App\Actions\Chat;

use App\Models\Message;
use App\Models\User;
use App\Support\ImageUploader;

/**
 * DM'de "Sohbet Bilgisi" ekranındaki paylaşılan medya grid'i (BACKLOG #86)
 * — ListDirectMessages ile aynı cursor deseni, sadece type=image.
 */
class ListDirectMessageMedia
{
    /**
     * @return array{data: array<int, array<string, mixed>>, next_cursor: string|null}
     */
    public function handle(User $Me, User $Other, ?string $Before, int $Limit = 30): array
    {
        $ParticipantIds = [$Me->id, $Other->id];
        sort($ParticipantIds);

        $Query = Message::where('participant_ids', $ParticipantIds)
            ->where('type', 'image')
            ->orderByDesc('id');

        if ($Before !== null) {
            $Query->where('id', '<', $Before);
        }

        $Messages = $Query->limit($Limit + 1)->get();
        $HasMore = $Messages->count() > $Limit;
        $Messages = $Messages->take($Limit);

        $Data = $Messages
            ->map(fn (Message $Message): array => [
                'id' => (string) $Message->id,
                'image_path' => ImageUploader::url($Message->image_path),
                'created_at' => $Message->created_at->toIso8601String(),
            ])
            ->values()
            ->all();

        return [
            'data' => $Data,
            'next_cursor' => $HasMore ? (string) $Messages->last()->id : null,
        ];
    }
}
