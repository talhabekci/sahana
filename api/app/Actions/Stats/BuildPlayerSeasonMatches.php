<?php

namespace App\Actions\Stats;

use App\Models\MatchParticipant;
use App\Models\PlayerMatchStat;
use App\Models\PlayerRating;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Sezon kartına dokununca açılan detay: oyuncunun o sezon katıldığı
 * maçların dökümü (BACKLOG #44, spec: 06-stats-rating.md §API).
 */
class BuildPlayerSeasonMatches
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function handle(User $Player, int $Season): array
    {
        $Participations = MatchParticipant::query()
            ->where('user_id', $Player->id)
            ->whereHas('match', fn (Builder $Query) => $Query->whereYear('starts_at', $Season))
            ->with(['match.team', 'match.opponentTeam', 'match.result'])
            ->get()
            ->sortByDesc(fn (MatchParticipant $Participation) => $Participation->match->starts_at)
            ->values();

        $MatchIds = $Participations->pluck('match.id')->all();

        $Stats = PlayerMatchStat::query()
            ->where('user_id', $Player->id)
            ->where('approved', true)
            ->whereIn('match_id', $MatchIds)
            ->get()
            ->keyBy('match_id');

        $Ratings = PlayerRating::query()
            ->where('ratee_id', $Player->id)
            ->whereIn('match_id', $MatchIds)
            ->get()
            ->groupBy('match_id');

        return $Participations->map(function (MatchParticipant $Participation) use ($Stats, $Ratings): array {
            $Match = $Participation->match;
            $Stat = $Stats->get($Match->id);
            $MatchRatings = $Ratings->get($Match->id);

            return [
                'match_id' => $Match->public_id,
                'starts_at' => $Match->starts_at->toIso8601String(),
                'venue_text' => $Match->venue_text,
                'team_name' => $Match->team->name,
                'opponent_team_name' => $Match->opponentTeam?->name,
                'home_score' => $Match->result?->home_score,
                'away_score' => $Match->result?->away_score,
                'goals' => (int) ($Stat->goals ?? 0),
                'assists' => (int) ($Stat->assists ?? 0),
                'average_score' => $MatchRatings !== null ? round($MatchRatings->avg('score'), 1) : null,
            ];
        })->all();
    }
}
