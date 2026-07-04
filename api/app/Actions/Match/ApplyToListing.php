<?php

namespace App\Actions\Match;

use App\Exceptions\ApiError;
use App\Models\ListingApplication;
use App\Models\PlayerListing;
use App\Models\User;

class ApplyToListing
{
    public function handle(PlayerListing $Listing, User $User, ?string $Note): ListingApplication
    {
        if ($Listing->status === 'filled') {
            throw new ApiError('İlan dolmuş.', 'listing_already_filled');
        }

        if (! $Listing->isOpen()) {
            throw new ApiError('İlan artık açık değil.', 'listing_closed');
        }

        if ($Listing->match->participantFor($User) !== null) {
            throw new ApiError('Zaten bu maçın kadrosundasın.', 'already_participant');
        }

        if ($Listing->applications()->where('user_id', $User->id)->exists()) {
            throw new ApiError('Bu ilana zaten başvurdun.', 'already_applied');
        }

        $Application = $Listing->applications()->create([
            'user_id' => $User->id,
            'note' => $Note,
        ]);

        // DB varsayılanları (status=pending) bellekteki modele yansısın.
        return $Application->refresh();
    }
}
