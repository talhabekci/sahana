<?php

namespace Database\Factories;

use App\Models\FootballMatch;
use App\Models\PlayerRating;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PlayerRating>
 */
class PlayerRatingFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'match_id' => FootballMatch::factory(),
            'rater_id' => User::factory(),
            'ratee_id' => User::factory(),
            'score' => fake()->numberBetween(1, 10),
        ];
    }
}
