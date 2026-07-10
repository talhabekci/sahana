<?php

namespace App\Http\Resources;

use App\Models\Message;
use App\Models\User;
use App\Support\ImageUploader;

/**
 * Message MongoDB modeli olduğu için standart JsonResource (Eloquent
 * ilişkisi/whenLoaded vb.) yerine düz bir şekillendirme yardımcısı —
 * yazar MySQL'den ayrıca çekilip elle eşleştiriliyor (spec: 07-notifications-chat.md).
 */
class MessageResource
{
    /** @return array<string, mixed> */
    public static function shape(Message $Message, ?User $Author): array
    {
        return [
            'id' => (string) $Message->id,
            'type' => $Message->type,
            'body' => $Message->body,
            'image_path' => ImageUploader::url($Message->image_path),
            'match_id' => $Message->match_id,
            'lineup_id' => $Message->lineup_id,
            'author' => $Author !== null ? [
                'id' => $Author->public_id,
                'name' => $Author->name,
                'avatar_path' => ImageUploader::url($Author->avatar_path),
            ] : null,
            'created_at' => $Message->created_at->toIso8601String(),
        ];
    }
}
