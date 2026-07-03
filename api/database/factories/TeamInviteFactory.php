<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\TeamInvite;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TeamInvite>
 */
class TeamInviteFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'code' => strtoupper(Str::random(8)),
            'created_by' => User::factory(),
        ];
    }
}
