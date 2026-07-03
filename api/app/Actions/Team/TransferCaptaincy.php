<?php

namespace App\Actions\Team;

use App\Exceptions\ApiError;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TransferCaptaincy
{
    public function handle(Team $Team, User $CurrentCaptain, User $NewCaptain): void
    {
        if (! $Team->isMember($NewCaptain)) {
            throw new ApiError('Bu kişi takımda değil.', 'not_team_member', 422);
        }

        if ($NewCaptain->id === $CurrentCaptain->id) {
            throw new ApiError('Zaten kaptansın.', 'already_captain', 422);
        }

        DB::transaction(function () use ($Team, $CurrentCaptain, $NewCaptain): void {
            $Team->members()->updateExistingPivot($CurrentCaptain->id, ['role' => 'member']);
            $Team->members()->updateExistingPivot($NewCaptain->id, ['role' => 'captain']);
        });
    }
}
