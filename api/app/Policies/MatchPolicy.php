<?php

namespace App\Policies;

use App\Models\FootballMatch;
use App\Models\User;

class MatchPolicy
{
    public function view(User $User, FootballMatch $Match): bool
    {
        if ($Match->participantFor($User) !== null) {
            return true;
        }

        if ($Match->team->isMember($User)) {
            return true;
        }

        return $Match->opponentTeam?->isMember($User) ?? false;
    }

    /** Maçı yönetme (güncelle/onayla/iptal/ilan aç) — sadece kaptan. */
    public function manage(User $User, FootballMatch $Match): bool
    {
        return $Match->isCaptain($User);
    }

    public function rsvp(User $User, FootballMatch $Match): bool
    {
        return $Match->participantFor($User) !== null;
    }

    /** Video ekleme — sadece maça katılan oyuncular (Modül 5). */
    public function addVideo(User $User, FootballMatch $Match): bool
    {
        return $Match->participantFor($User) !== null;
    }
}
