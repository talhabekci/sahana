<?php

namespace App\Actions\Stats;

use App\Exceptions\ApiError;
use App\Models\FootballMatch;
use App\Models\MatchResult;
use App\Models\User;

class ConfirmMatchResult
{
    public function handle(FootballMatch $Match, User $Captain): MatchResult
    {
        $Result = $Match->result;

        if ($Result === null || $Result->status !== 'pending') {
            throw new ApiError('Onaylanacak bekleyen bir skor yok.', 'no_pending_result');
        }

        $Result->forceFill(['status' => 'confirmed', 'confirmed_by' => $Captain->id])->save();

        return $Result;
    }
}
