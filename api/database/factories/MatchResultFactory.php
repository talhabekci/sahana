<?php

namespace Database\Factories;

use App\Models\FootballMatch;
use App\Models\MatchResult;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MatchResult>
 */
class MatchResultFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'match_id' => FootballMatch::factory(),
            'home_score' => fake()->numberBetween(0, 6),
            'away_score' => fake()->numberBetween(0, 6),
            'entered_by' => User::factory(),
            'status' => 'pending',
        ];
    }
}
