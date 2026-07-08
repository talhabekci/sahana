<?php

namespace Database\Factories;

use App\Models\FootballMatch;
use App\Models\User;
use App\Models\Venue;
use App\Models\VenueReview;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VenueReview>
 */
class VenueReviewFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'venue_id' => Venue::factory(),
            'user_id' => User::factory(),
            'match_id' => FootballMatch::factory(),
            'score' => fake()->numberBetween(1, 5),
            'body' => fake()->sentence(),
        ];
    }
}
