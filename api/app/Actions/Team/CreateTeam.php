<?php

namespace App\Actions\Team;

use App\Models\Team;
use App\Models\User;

class CreateTeam
{
    /**
     * @param  array{name: string, badge_icon: string, color_home: string}  $Data
     */
    public function handle(User $Creator, array $Data): Team
    {
        $Team = Team::create([...$Data, 'created_by' => $Creator->id]);

        $Team->members()->attach($Creator->id, [
            'role' => 'captain',
            'joined_at' => now(),
        ]);

        return $Team->fresh('members');
    }
}
