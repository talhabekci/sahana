<?php

namespace App\Actions\Stats;

use App\Exceptions\ApiError;
use App\Models\FootballMatch;
use App\Models\MatchResult;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class EnterMatchResult
{
    /**
     * @param  array<int, string>  $NoShowUserPublicIds  RSVP=yes katılımcılardan gelmeyenler
     */
    public function handle(
        FootballMatch $Match,
        User $Captain,
        int $HomeScore,
        int $AwayScore,
        array $NoShowUserPublicIds = [],
    ): MatchResult {
        if ($Match->opponent_team_id === null) {
            throw new ApiError('Bu maçın kayıtlı bir rakip takımı yok, skor girilemez.', 'no_opponent_team');
        }

        if (now()->lessThan($Match->starts_at)) {
            throw new ApiError('Maç henüz oynanmadı.', 'match_not_played_yet');
        }

        if ($Match->result !== null) {
            throw new ApiError('Bu maç için skor zaten girilmiş.', 'result_already_exists');
        }

        return DB::transaction(function () use ($Match, $Captain, $HomeScore, $AwayScore, $NoShowUserPublicIds): MatchResult {
            $Result = MatchResult::create([
                'match_id' => $Match->id,
                'home_score' => $HomeScore,
                'away_score' => $AwayScore,
                'entered_by' => $Captain->id,
                'status' => 'pending',
            ]);

            $NoShowIds = User::whereIn('public_id', $NoShowUserPublicIds)->pluck('id');

            foreach ($Match->participants as $Participant) {
                if ($Participant->rsvp !== 'yes') {
                    continue;
                }

                $Participant->forceFill(['attended' => ! $NoShowIds->contains($Participant->user_id)])->save();
            }

            return $Result;
        });
    }
}
