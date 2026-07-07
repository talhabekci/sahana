<?php

namespace App\Actions\Match;

use App\Exceptions\ApiError;
use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\User;
use App\Notifications\MatchCreatedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class CreateMatch
{
    /**
     * @param  array{venue_text: string, venue_lat?: float|null, venue_lng?: float|null, starts_at: string, format: int, price_per_player?: int|null}  $Data
     */
    public function handle(Team $Team, User $Creator, array $Data): FootballMatch
    {
        if (! $Team->isCaptain($Creator)) {
            throw new ApiError('Maçı sadece takım kaptanı oluşturabilir.', 'forbidden', 403);
        }

        $Match = DB::transaction(function () use ($Team, $Creator, $Data): FootballMatch {
            $Match = FootballMatch::create([
                ...$Data,
                'team_id' => $Team->id,
                'created_by' => $Creator->id,
            ]);

            // Spec akışı: maç kurulunca takım üyeleri katılımcı olur, RSVP bekler.
            foreach ($Team->members as $Member) {
                $Match->participants()->create([
                    'user_id' => $Member->id,
                    'source' => 'team',
                ]);
            }

            return $Match->fresh(['team', 'participants.user']);
        });

        $Recipients = $Team->members->reject(fn (User $Member): bool => $Member->id === $Creator->id);
        Notification::send($Recipients, new MatchCreatedNotification($Match));

        return $Match;
    }
}
