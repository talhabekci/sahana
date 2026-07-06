<?php

namespace App\Actions\Stats;

use App\Models\MatchParticipant;
use App\Models\PlayerMatchStat;
use App\Models\PlayerRating;
use App\Models\User;
use App\Support\RatingCalculator;
use Illuminate\Database\Eloquent\Builder;

class BuildPlayerStats
{
    /** Kararlar: min 3 puan gelmeden reyting gösterilmez; sezon = takvim yılı. */
    private const MIN_RATINGS_FOR_DISPLAY = 3;

    private const RECENT_MATCHES_LIMIT = 5;

    /**
     * @return array<string, mixed>
     */
    public function handle(User $Player, int $Season): array
    {
        $MatchesCount = MatchParticipant::query()
            ->where('user_id', $Player->id)
            ->whereHas('match', fn (Builder $Query) => $Query->whereYear('starts_at', $Season))
            ->count();

        $StatsTotals = PlayerMatchStat::query()
            ->where('user_id', $Player->id)
            ->where('approved', true)
            ->whereHas('match', fn (Builder $Query) => $Query->whereYear('starts_at', $Season))
            ->selectRaw('COALESCE(SUM(goals), 0) as goals, COALESCE(SUM(assists), 0) as assists')
            ->first();

        $AllRatings = PlayerRating::where('ratee_id', $Player->id)->get();
        $RatingsCount = $AllRatings->count();
        $Rating = $RatingsCount >= self::MIN_RATINGS_FOR_DISPLAY
            ? RatingCalculator::weightedAverage($AllRatings)
            : null;

        $Attended = MatchParticipant::query()->where('user_id', $Player->id)->where('attended', true)->count();
        $NoShow = MatchParticipant::query()->where('user_id', $Player->id)->where('attended', false)->count();
        $Reliability = ($Attended + $NoShow) > 0 ? (int) round(($Attended / ($Attended + $NoShow)) * 100) : null;

        $RecentRatings = PlayerRating::where('ratee_id', $Player->id)
            ->with('match')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->groupBy('match_id')
            ->map(fn ($Group) => [
                'match_id' => $Group->first()->match->public_id,
                'starts_at' => $Group->first()->match->starts_at->toIso8601String(),
                'average_score' => round($Group->avg('score'), 1),
            ])
            ->sortByDesc('starts_at')
            ->take(self::RECENT_MATCHES_LIMIT)
            ->values();

        return [
            'season' => $Season,
            'matches' => $MatchesCount,
            'goals' => (int) ($StatsTotals->goals ?? 0),
            'assists' => (int) ($StatsTotals->assists ?? 0),
            'rating' => $Rating,
            'ratings_count' => $RatingsCount,
            'reliability' => $Reliability,
            'recent_ratings' => $RecentRatings,
        ];
    }
}
