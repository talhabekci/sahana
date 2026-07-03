<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Team>
 */
class TeamFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->city().' FK',
            'badge_icon' => fake()->randomElement(Team::BADGE_ICONS),
            'color_home' => fake()->hexColor(),
            'created_by' => User::factory(),
        ];
    }
}
