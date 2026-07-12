<?php

namespace App\Actions\Stats;

use App\Exceptions\ApiError;
use App\Models\FootballMatch;
use App\Models\PlayerMatchStat;
use App\Models\User;

class SubmitPlayerStat
{
    public function __construct(private readonly AwardBadges $AwardBadges) {}

    /**
     * Kaptan herhangi bir katılımcı için girer (direkt onaylı); oyuncu sadece
     * kendisi için girer (kaptan onayı bekler).
     */
    public function handle(FootballMatch $Match, User $Actor, User $TargetPlayer, int $Goals, int $Assists): PlayerMatchStat
    {
        if ($Match->participantFor($TargetPlayer) === null) {
            throw new ApiError('Bu oyuncu maçın katılımcısı değil.', 'not_participant');
        }

        $IsCaptain = $Match->isCaptain($Actor);

        if (! $IsCaptain && $Actor->id !== $TargetPlayer->id) {
            throw new ApiError('Sadece kaptan ya da oyuncunun kendisi istatistik girebilir.', 'forbidden', 403);
        }

        $Stat = PlayerMatchStat::updateOrCreate(
            ['match_id' => $Match->id, 'user_id' => $TargetPlayer->id],
            [
                'goals' => $Goals,
                'assists' => $Assists,
                'approved' => $IsCaptain,
                'entered_by' => $Actor->id,
            ],
        );

        // BACKLOG #54: kaptan girişi direkt onaylı olduğundan gol rozetleri
        // (ilk_gol/hat_trick) burada hemen kontrol edilir.
        if ($IsCaptain) {
            $this->AwardBadges->handle($TargetPlayer);
        }

        return $Stat;
    }
}
