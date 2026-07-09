<?php

namespace App\Actions\Match;

use App\Exceptions\ApiError;
use App\Models\OpponentListing;
use App\Models\Team;
use App\Models\User;
use App\Notifications\OpponentFoundNotification;
use Illuminate\Support\Facades\DB;

class MatchOpponentListing
{
    public function handle(OpponentListing $Listing, Team $OpponentTeam, User $Actor): OpponentListing
    {
        if ($Listing->status !== 'open') {
            throw new ApiError('İlan artık açık değil.', 'listing_closed');
        }

        if (! $OpponentTeam->isCaptain($Actor)) {
            throw new ApiError('Bu takım adına sadece kaptanı eşleşebilir.', 'forbidden', 403);
        }

        if ($OpponentTeam->id === $Listing->team_id) {
            throw new ApiError('Kendi ilanınla eşleşemezsin.', 'cannot_match_own_listing');
        }

        DB::transaction(function () use ($Listing, $OpponentTeam): void {
            $Listing->forceFill(['status' => 'matched'])->save();

            if ($Listing->match_id !== null) {
                $Listing->match->forceFill(['opponent_team_id' => $OpponentTeam->id])->save();
            }
        });

        $Listing = $Listing->fresh(['team', 'match']);

        $Captain = $Listing->team->captain();

        if ($Captain !== null) {
            $Captain->notify(new OpponentFoundNotification($Listing, $OpponentTeam));
        }

        return $Listing;
    }
}
