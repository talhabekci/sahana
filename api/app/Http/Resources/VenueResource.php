<?php

namespace App\Http\Resources;

use App\Models\Venue;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Venue
 */
class VenueResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        return [
            'id' => $this->public_id,
            'name' => $this->name,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'address' => $this->address,
            'photos' => $this->photos,
            'price_min' => $this->price_min,
            'price_max' => $this->price_max,
            'amenities' => $this->amenities,
            'status' => $this->status,
            'reviews_count' => $this->whenCounted('reviews'),
            'average_score' => $this->getAttribute('reviews_avg_score') !== null
                ? round((float) $this->getAttribute('reviews_avg_score'), 1)
                : null,
            'distance_km' => $this->when(
                $this->getAttribute('distance_km') !== null,
                fn (): float => round((float) $this->getAttribute('distance_km'), 1),
            ),
            'reviews' => VenueReviewResource::collection($this->whenLoaded('reviews')),
        ];
    }
}
