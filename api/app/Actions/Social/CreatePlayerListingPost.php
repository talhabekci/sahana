<?php

namespace App\Actions\Social;

use App\Models\PlayerListing;
use App\Models\Post;
use App\Models\User;

class CreatePlayerListingPost
{
    /** Otomatik "adam eksik" kartı; ilanı açan kaptanın profil ayarına bağlı. */
    public function handle(PlayerListing $Listing, User $Creator): ?Post
    {
        if ($Creator->profile?->auto_posts_enabled === false) {
            return null;
        }

        return Post::create([
            'user_id' => $Creator->id,
            'team_id' => $Listing->match->team_id,
            'type' => 'player_listing',
            'player_listing_id' => $Listing->id,
        ]);
    }
}
