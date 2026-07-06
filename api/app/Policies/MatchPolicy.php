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

    /** Skor girme — sadece ev sahibi (maçı oluşturan) takımın kaptanı (Modül 6). */
    public function enterResult(User $User, FootballMatch $Match): bool
    {
        return $Match->isCaptain($User);
    }

    /** Skor onaylama/itiraz — sadece rakip takımın kaptanı (Modül 6). */
    public function confirmResult(User $User, FootballMatch $Match): bool
    {
        return $Match->opponentTeam?->isCaptain($User) ?? false;
    }

    public function disputeResult(User $User, FootballMatch $Match): bool
    {
        return $this->confirmResult($User, $Match);
    }

    /** İstatistik/reyting girme — sadece maça katılan oyuncular (Modül 6). */
    public function enterStat(User $User, FootballMatch $Match): bool
    {
        return $Match->participantFor($User) !== null;
    }

    public function rate(User $User, FootballMatch $Match): bool
    {
        return $Match->participantFor($User) !== null;
    }
}
