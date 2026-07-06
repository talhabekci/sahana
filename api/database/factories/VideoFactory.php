<?php

namespace Database\Factories;

use App\Models\FootballMatch;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Video>
 */
class VideoFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'match_id' => FootballMatch::factory(),
            'user_id' => User::factory(),
            'type' => 'external_link',
            'provider' => 'other',
            'url' => fake()->url(),
        ];
    }
}
