<?php

namespace App\Actions\Stats;

use App\Exceptions\ApiError;
use App\Models\PlayerMatchStat;

class ApprovePlayerStat
{
    public function handle(PlayerMatchStat $Stat): PlayerMatchStat
    {
        if ($Stat->approved) {
            throw new ApiError('Bu istatistik zaten onaylı.', 'already_approved');
        }

        $Stat->forceFill(['approved' => true])->save();

        return $Stat;
    }
}
