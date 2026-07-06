<?php

namespace App\Support;

use App\Models\PlayerRating;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class RatingCalculator
{
    /** Üstel azalma yarı ömrü (gün) — spec kararı: 45 gün. */
    private const HALF_LIFE_DAYS = 45;

    /**
     * Zaman ağırlıklı ortalama: `weight = 0.5^(gün/45)`. Boş koleksiyon için null.
     *
     * @param  Collection<int, PlayerRating>  $Ratings
     */
    public static function weightedAverage(Collection $Ratings): ?float
    {
        if ($Ratings->isEmpty()) {
            return null;
        }

        $Now = Carbon::now();
        $WeightSum = 0.0;
        $ScoreWeightSum = 0.0;

        foreach ($Ratings as $Rating) {
            $DaysAgo = $Rating->created_at->diffInHours($Now) / 24;
            $Weight = 0.5 ** ($DaysAgo / self::HALF_LIFE_DAYS);

            $WeightSum += $Weight;
            $ScoreWeightSum += $Weight * $Rating->score;
        }

        return $WeightSum > 0 ? round($ScoreWeightSum / $WeightSum, 2) : null;
    }
}
