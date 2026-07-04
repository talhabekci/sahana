<?php

namespace App\Actions\Match;

use App\Exceptions\ApiError;
use App\Models\FootballMatch;
use App\Models\MatchParticipant;
use App\Models\User;

class SubmitRsvp
{
    /** Idempotent: aynı yanıtı tekrar göndermek durumu bozmaz (api-conventions §6). */
    public function handle(FootballMatch $Match, User $User, string $Rsvp): MatchParticipant
    {
        if (! in_array($Match->status, ['draft', 'confirmed'], true)) {
            throw new ApiError('Bu maç için katılım bildirimi kapalı.', 'match_closed');
        }

        $Participant = $Match->participantFor($User);

        if ($Participant === null) {
            throw new ApiError('Bu maçın katılımcısı değilsin.', 'not_participant', 403);
        }

        $Participant->forceFill(['rsvp' => $Rsvp, 'responded_at' => now()])->save();

        return $Participant;
    }
}
