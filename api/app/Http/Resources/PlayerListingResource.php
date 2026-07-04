<?php

namespace App\Http\Resources;

use App\Models\PlayerListing;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PlayerListing
 */
class PlayerListingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        return [
            'id' => $this->public_id,
            'positions_needed' => $this->positions_needed,
            'needed_count' => $this->needed_count,
            'level_min' => $this->level_min,
            'level_max' => $this->level_max,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'status' => $this->status,
            'expires_at' => $this->expires_at->toIso8601String(),
            // Keşif sorgusunda controller haversine ile hesaplayıp set eder.
            'distance_km' => $this->when(
                $this->getAttribute('distance_km') !== null,
                fn () => round((float) $this->getAttribute('distance_km'), 1),
            ),
            'my_application_status' => $this->getAttribute('my_application_status'),
            'match' => $this->whenLoaded('match', fn (): array => [
                'id' => $this->match->public_id,
                'starts_at' => $this->match->starts_at->toIso8601String(),
                'venue_text' => $this->match->venue_text,
                'format' => $this->match->format,
                'price_per_player' => $this->match->price_per_player,
                'team_name' => $this->match->relationLoaded('team') ? $this->match->team->name : null,
            ]),
            'applications' => ListingApplicationResource::collection($this->whenLoaded('applications')),
        ];
    }
}
