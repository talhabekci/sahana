<?php

namespace App\Actions\Stats;

use App\Exceptions\ApiError;
use App\Models\PlayerMatchStat;

class ApprovePlayerStat
{
    public function __construct(private readonly AwardBadges $AwardBadges) {}

    public function handle(PlayerMatchStat $Stat): PlayerMatchStat
    {
        if ($Stat->approved) {
            throw new ApiError('Bu istatistik zaten onaylı.', 'already_approved');
        }

        $Stat->forceFill(['approved' => true])->save();

        $this->AwardBadges->handle($Stat->user);

        return $Stat;
    }
}
