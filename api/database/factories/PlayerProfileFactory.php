<?php

namespace Database\Factories;

use App\Models\PlayerProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PlayerProfile>
 */
class PlayerProfileFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'positions' => [fake()->randomElement(PlayerProfile::POSITIONS)],
            'foot' => fake()->randomElement(['L', 'R', 'B']),
            'level' => fake()->numberBetween(1, 5),
            'city_id' => 34,
            'district' => 'Kadıköy',
        ];
    }
}
