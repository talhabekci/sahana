<?php

namespace App\Actions\Venue;

use App\Exceptions\ApiError;
use App\Models\FootballMatch;
use App\Models\User;
use App\Models\Venue;
use App\Models\VenueReview;

class CreateVenueReview
{
    /**
     * Sahte yorum direnci (spec: 08-venues.md §Aşama 1) — sadece o sahada
     * oynanmış, kullanıcının katılımcısı olduğu bir maça dayanarak yorum
     * yapılabilir.
     *
     * @param  array{match_id: string, score: int, body?: string|null}  $Data
     */
    public function handle(Venue $Venue, User $User, array $Data): VenueReview
    {
        $Match = FootballMatch::where('public_id', $Data['match_id'])->first();

        if ($Match === null || $Match->venue_id !== $Venue->id) {
            throw new ApiError('Bu maç bu sahaya ait değil.', 'not_found', 404);
        }

        if ($Match->status !== 'played') {
            throw new ApiError('Sadece oynanmış maçlar için yorum yapılabilir.', 'match_not_played', 422);
        }

        if ($Match->participantFor($User) === null) {
            throw new ApiError('Bu maçın katılımcısı olmadığın için yorum yapamazsın.', 'forbidden', 403);
        }

        $AlreadyReviewed = VenueReview::where('venue_id', $Venue->id)->where('user_id', $User->id)->exists();

        if ($AlreadyReviewed) {
            throw new ApiError('Bu sahaya zaten yorum yaptın.', 'already_reviewed', 422);
        }

        return VenueReview::create([
            'venue_id' => $Venue->id,
            'user_id' => $User->id,
            'match_id' => $Match->id,
            'score' => $Data['score'],
            'body' => $Data['body'] ?? null,
        ]);
    }
}
