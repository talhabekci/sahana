<?php

namespace App\Actions\Match;

use App\Exceptions\ApiError;
use App\Models\OpponentListing;
use App\Models\Team;
use App\Models\User;

class CreateOpponentListing
{
    /**
     * @param  array{match_id?: int|null, note?: string|null, lat?: float|null, lng?: float|null}  $Data
     */
    public function handle(Team $Team, User $Creator, array $Data): OpponentListing
    {
        if (! $Team->isCaptain($Creator)) {
            throw new ApiError('İlanı sadece takım kaptanı açabilir.', 'forbidden', 403);
        }

        $Listing = OpponentListing::create([
            ...$Data,
            'team_id' => $Team->id,
            'created_by' => $Creator->id,
        ]);

        // DB varsayılanları (status=open) bellekteki modele yansısın.
        return $Listing->refresh();
    }
}
