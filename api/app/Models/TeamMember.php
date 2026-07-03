<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Support\Carbon;

/**
 * @property Carbon $joined_at
 * @property string $role
 * @property int|null $jersey_number
 */
class TeamMember extends Pivot
{
    public $timestamps = false;

    protected $table = 'team_members';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
        ];
    }
}
