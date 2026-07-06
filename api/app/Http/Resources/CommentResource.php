<?php

namespace App\Http\Resources;

use App\Models\Comment;
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
                'avatar_path' => $this->user->avatar_path,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
