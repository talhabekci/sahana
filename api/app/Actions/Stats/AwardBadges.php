<?php

namespace App\Actions\Stats;

use App\Models\MatchParticipant;
use App\Models\PlayerBadge;
use App\Models\PlayerMatchStat;
use App\Models\PlayerRating;
use App\Models\Post;
use App\Models\User;
use App\Support\BadgeCatalog;
use App\Support\RatingCalculator;
use Illuminate\Support\Collection;

/**
 * Rozet kontrolü (BACKLOG #54) — skor girişi, istatistik onayı ve reyting
 * girişi sonrasında ilgili oyuncu için çağrılır. İdempotent: `player_badges`
 * unique(user_id, badge_key) sayesinde bir rozet bir kez kazanılır.
 */
class AwardBadges
{
    private const STREAK_LENGTH = 5;

    private const RELIABILITY_MIN_PERCENT = 90;

    private const RELIABILITY_MIN_MATCHES = 5;

    private const STAR_MIN_AVERAGE = 8.5;

    private const STAR_MIN_RATINGS = 5;

    /** @return Collection<int, string> yeni kazanılan rozet anahtarları */
    public function handle(User $Player): Collection
    {
        $Existing = PlayerBadge::where('user_id', $Player->id)->pluck('badge_key');
        $NewlyEarned = collect();

        foreach (array_keys(BadgeCatalog::ALL) as $Key) {
            if ($Existing->contains($Key) || ! $this->meetsCondition($Key, $Player)) {
                continue;
            }

            PlayerBadge::create(['user_id' => $Player->id, 'badge_key' => $Key, 'earned_at' => now()]);
            $NewlyEarned->push($Key);
        }

        if ($NewlyEarned->isNotEmpty() && $Player->profile?->auto_posts_enabled !== false) {
            foreach ($NewlyEarned as $Key) {
                Post::create(['user_id' => $Player->id, 'type' => 'badge_earned', 'badge_key' => $Key]);
            }
        }

        return $NewlyEarned;
    }

    private function meetsCondition(string $Key, User $Player): bool
    {
        return match ($Key) {
            'ilk_gol' => PlayerMatchStat::where('user_id', $Player->id)
                ->where('approved', true)->where('goals', '>=', 1)->exists(),
            'hat_trick' => PlayerMatchStat::where('user_id', $Player->id)
                ->where('approved', true)->where('goals', '>=', 3)->exists(),
            'seri_5' => $this->hasAttendanceStreak($Player, self::STREAK_LENGTH),
            'guvenilir' => $this->hasReliability($Player, self::RELIABILITY_MIN_PERCENT, self::RELIABILITY_MIN_MATCHES),
            'yildiz' => $this->hasStarRating($Player, self::STAR_MIN_AVERAGE, self::STAR_MIN_RATINGS),
            default => false,
        };
    }

    private function hasAttendanceStreak(User $Player, int $Length): bool
    {
        $Recent = MatchParticipant::where('user_id', $Player->id)
            ->whereNotNull('attended')
            ->with('match')
            ->get()
            ->filter(fn (MatchParticipant $Participation): bool => $Participation->match !== null)
            ->sortByDesc(fn (MatchParticipant $Participation) => $Participation->match->starts_at)
            ->take($Length)
            ->values();

        return $Recent->count() === $Length
            && $Recent->every(fn (MatchParticipant $Participation): bool => $Participation->attended === true);
    }

    private function hasReliability(User $Player, int $MinPercent, int $MinMatches): bool
    {
        $Attended = MatchParticipant::where('user_id', $Player->id)->where('attended', true)->count();
        $NoShow = MatchParticipant::where('user_id', $Player->id)->where('attended', false)->count();
        $Total = $Attended + $NoShow;

        if ($Total < $MinMatches) {
            return false;
        }

        return ($Attended / $Total) * 100 >= $MinPercent;
    }

    private function hasStarRating(User $Player, float $MinAverage, int $MinRatings): bool
    {
        $Ratings = PlayerRating::where('ratee_id', $Player->id)->get();

        if ($Ratings->count() < $MinRatings) {
            return false;
        }

        $Average = RatingCalculator::weightedAverage($Ratings);

        return $Average !== null && $Average >= $MinAverage;
    }
}
