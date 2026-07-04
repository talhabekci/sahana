<?php

namespace Database\Factories;

use App\Models\FootballMatch;
use App\Models\PlayerListing;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PlayerListing>
 */
class PlayerListingFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'match_id' => FootballMatch::factory(),
            'positions_needed' => ['defans'],
            'needed_count' => 2,
            'level_min' => 2,
            'level_max' => 4,
            'lat' => 41.0082,
            'lng' => 28.9784,
            'expires_at' => now()->addDays(2),
        ];
    }
}
