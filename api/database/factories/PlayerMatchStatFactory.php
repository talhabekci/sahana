<?php

namespace Database\Factories;

use App\Models\FootballMatch;
use App\Models\PlayerMatchStat;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PlayerMatchStat>
 */
class PlayerMatchStatFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'match_id' => FootballMatch::factory(),
            'user_id' => User::factory(),
            'goals' => fake()->numberBetween(0, 3),
            'assists' => fake()->numberBetween(0, 3),
            'approved' => false,
            'entered_by' => User::factory(),
        ];
    }
}
