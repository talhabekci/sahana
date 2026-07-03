<?php

namespace App\Actions\Team;

use App\Exceptions\ApiError;
use App\Models\Team;
use App\Models\User;

class RemoveTeamMember
{
    public function handle(Team $Team, User $ActingUser, User $TargetUser): void
    {
        if (! $Team->isMember($TargetUser)) {
            throw new ApiError('Bu kişi takımda değil.', 'not_team_member', 404);
        }

        $ActingIsSelf = $ActingUser->id === $TargetUser->id;
        $ActingIsCaptain = $Team->isCaptain($ActingUser);

        if (! $ActingIsSelf && ! $ActingIsCaptain) {
            throw new ApiError('Bu işlem için yetkin yok.', 'forbidden', 403);
        }

        if ($Team->isCaptain($TargetUser)) {
            throw new ApiError(
                'Kaptan takımdan ayrılamaz — önce kaptanlığı devret.',
                'captain_must_transfer_first',
            );
        }

        $Team->members()->detach($TargetUser->id);
    }
}
