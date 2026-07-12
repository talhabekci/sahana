<?php

namespace App\Actions\Stats;

use App\Exceptions\ApiError;
use App\Models\FootballMatch;
use App\Models\PlayerRating;
use App\Models\User;
use Illuminate\Support\Carbon;

class SubmitRating
{
    /** Puanlama penceresi: maç başlangıcından 48 saat sonrasına kadar. */
    private const WINDOW_HOURS = 48;

    public function __construct(private readonly AwardBadges $AwardBadges) {}

    public function handle(FootballMatch $Match, User $Rater, User $Ratee, int $Score): PlayerRating
    {
        if ($Rater->id === $Ratee->id) {
            throw new ApiError('Kendine puan veremezsin.', 'cannot_rate_self');
        }

        if ($Match->status === 'cancelled') {
            throw new ApiError('İptal edilen maç için puanlama yapılamaz.', 'match_cancelled');
        }

        if ($Match->participantFor($Rater) === null || $Match->participantFor($Ratee) === null) {
            throw new ApiError('Puanlama sadece maçın katılımcıları arasında yapılabilir.', 'not_participant');
        }

        $Now = Carbon::now();
        $WindowEnd = $Match->starts_at->copy()->addHours(self::WINDOW_HOURS);

        if ($Now->lessThan($Match->starts_at) || $Now->greaterThan($WindowEnd)) {
            throw new ApiError('Puanlama sadece maçtan sonraki 48 saat içinde yapılabilir.', 'rating_window_closed');
        }

        $Rating = PlayerRating::updateOrCreate(
            ['match_id' => $Match->id, 'rater_id' => $Rater->id, 'ratee_id' => $Ratee->id],
            ['score' => $Score],
        );

        $this->AwardBadges->handle($Ratee);

        return $Rating;
    }
}
