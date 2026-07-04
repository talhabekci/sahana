<?php

namespace App\Http\Resources;

use App\Models\OpponentListing;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin OpponentListing
 */
class OpponentListingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        return [
            'id' => $this->public_id,
            'note' => $this->note,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'status' => $this->status,
            'team' => $this->whenLoaded('team', fn (): array => [
                'id' => $this->team->public_id,
                'name' => $this->team->name,
                'badge_icon' => $this->team->badge_icon,
                'color_home' => $this->team->color_home,
            ]),
            'match' => $this->whenLoaded('match', fn (): ?array => $this->match !== null ? [
                'id' => $this->match->public_id,
                'starts_at' => $this->match->starts_at->toIso8601String(),
                'venue_text' => $this->match->venue_text,
                'format' => $this->match->format,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
