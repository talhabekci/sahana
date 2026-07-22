<?php

namespace App\Http\Resources;

use App\Models\Comment;
use App\Models\User;
use App\Support\ImageUploader;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Comment
 */
class CommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        return [
            'id' => $this->public_id,
            'body' => $this->body,
            'author' => $this->whenLoaded('user', fn (): array => [
                'id' => $this->user->public_id,
                'name' => $this->user->name,
                'avatar_path' => ImageUploader::url($this->user->avatar_path),
            ]),
            // BACKLOG #82: "@Ad Soyad" metnini doğru kullanıcıya bağlayabilmek
            // için — güncel isimle (kaydedildiği andaki değil) çözülüyor.
            'mentions' => $this->mentioned_user_ids !== null
                ? User::whereIn('public_id', $this->mentioned_user_ids)
                    ->get(['public_id', 'name'])
                    ->map(fn (User $Mentioned): array => ['id' => $Mentioned->public_id, 'name' => $Mentioned->name])
                    ->values()
                : [],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
