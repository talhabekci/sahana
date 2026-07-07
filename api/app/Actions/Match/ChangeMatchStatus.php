<?php

namespace App\Actions\Match;

use App\Exceptions\ApiError;
use App\Models\FootballMatch;
use App\Notifications\MatchConfirmedNotification;
use Illuminate\Support\Facades\Notification;

class ChangeMatchStatus
{
    /** Spec yaşam döngüsü: draft → confirmed → played; draft|confirmed → cancelled. */
    private const TRANSITIONS = [
        'confirm' => ['from' => ['draft'], 'to' => 'confirmed'],
        'cancel' => ['from' => ['draft', 'confirmed'], 'to' => 'cancelled'],
    ];

    public function handle(FootballMatch $Match, string $Transition): FootballMatch
    {
        $Rule = self::TRANSITIONS[$Transition] ?? null;

        if ($Rule === null || ! in_array($Match->status, $Rule['from'], true)) {
            throw new ApiError('Bu maç için geçersiz durum geçişi.', 'invalid_status_transition');
        }

        $Match->forceFill(['status' => $Rule['to']])->save();

        if ($Transition === 'confirm') {
            Notification::send($Match->team->members, new MatchConfirmedNotification($Match));
        }

        return $Match;
    }
}
