<?php

namespace Database\Factories;

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FootballMatch>
 */
class FootballMatchFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'venue_text' => fake()->streetName().' Halı Saha',
            'venue_lat' => 41.0 + fake()->randomFloat(4, -0.2, 0.2),
            'venue_lng' => 29.0 + fake()->randomFloat(4, -0.2, 0.2),
            'starts_at' => now()->addDays(2)->setTime(21, 0),
            'format' => 7,
            'price_per_player' => 150,
            'created_by' => User::factory(),
        ];
    }
}
