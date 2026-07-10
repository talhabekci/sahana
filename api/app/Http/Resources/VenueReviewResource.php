<?php

namespace App\Http\Resources;

use App\Models\VenueReview;
use App\Support\ImageUploader;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin VenueReview
 */
class VenueReviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        return [
            'id' => $this->id,
            'score' => $this->score,
            'body' => $this->body,
            'author' => $this->whenLoaded('user', fn (): array => [
                'id' => $this->user->public_id,
                'name' => $this->user->name,
                'avatar_path' => ImageUploader::url($this->user->avatar_path),
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
