<?php

namespace App\Actions\Match;

use App\Actions\Social\CreatePlayerListingPost;
use App\Exceptions\ApiError;
use App\Models\FootballMatch;
use App\Models\PlayerListing;

class CreatePlayerListing
{
    public function __construct(
        private readonly CreatePlayerListingPost $CreatePost,
    ) {}

    /**
     * @param  array{positions_needed: list<string>, needed_count: int, level_min: int, level_max: int, lat: float, lng: float}  $Data
     */
    public function handle(FootballMatch $Match, array $Data): PlayerListing
    {
        if (in_array($Match->status, ['played', 'cancelled'], true)) {
            throw new ApiError('Kapanmış maç için ilan açılamaz.', 'match_closed');
        }

        // Spec: maç saati geçen ilanlar expired olur — süre maç başlangıcına bağlı.
        $Listing = $Match->listings()->create([
            ...$Data,
            'expires_at' => $Match->starts_at,
        ]);

        // DB varsayılanları (status=open) bellekteki modele yansısın.
        $Listing->refresh();

        // Modül 4: feed'e otomatik "adam eksik" kartı (spec: 04-social-feed.md).
        if ($Match->createdBy !== null) {
            $Listing->setRelation('match', $Match);
            $this->CreatePost->handle($Listing, $Match->createdBy);
        }

        return $Listing;
    }
}
