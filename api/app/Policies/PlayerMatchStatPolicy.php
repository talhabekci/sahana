<?php

namespace App\Policies;

use App\Models\PlayerMatchStat;
use App\Models\User;

class PlayerMatchStatPolicy
{
    /** Onaylama — sadece maçın (ev sahibi takımın) kaptanı. */
    public function approve(User $User, PlayerMatchStat $Stat): bool
    {
        return $Stat->match->isCaptain($User);
    }
}
