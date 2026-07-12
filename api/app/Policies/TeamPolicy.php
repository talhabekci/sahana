<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    /** Takım sohbeti erişimi (BACKLOG #53'ten sonra da üyelere özel kaldı). */
    public function view(User $User, Team $Team): bool
    {
        return $Team->isMember($User);
    }

    public function update(User $User, Team $Team): bool
    {
        return $Team->isCaptain($User);
    }

    public function delete(User $User, Team $Team): bool
    {
        return $Team->isCaptain($User);
    }

    public function manageInvites(User $User, Team $Team): bool
    {
        return $Team->isCaptain($User);
    }

    public function transferCaptaincy(User $User, Team $Team): bool
    {
        return $Team->isCaptain($User);
    }

    public function manageLineups(User $User, Team $Team): bool
    {
        return $Team->isMember($User);
    }
}
