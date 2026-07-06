<?php

namespace App\Http\Resources;

use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Video
 */
class VideoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        return [
            'id' => $this->public_id,
            'type' => $this->type,
            'provider' => $this->provider,
            'url' => $this->url,
            'title' => $this->title,
            'thumbnail_url' => $this->thumbnail_url,
            'uploader' => $this->whenLoaded('user', fn (): array => [
                'id' => $this->user->public_id,
                'name' => $this->user->name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
