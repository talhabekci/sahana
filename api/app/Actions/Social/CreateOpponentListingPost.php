<?php

namespace App\Actions\Social;

use App\Models\OpponentListing;
use App\Models\Post;
use App\Models\User;

class CreateOpponentListingPost
{
    /** Otomatik "rakip arıyoruz" kartı; ilanı açan kaptanın profil ayarına bağlı. */
    public function handle(OpponentListing $Listing, User $Creator): ?Post
    {
        if ($Creator->profile?->auto_posts_enabled === false) {
            return null;
        }

        return Post::create([
            'user_id' => $Creator->id,
            'team_id' => $Listing->team_id,
            'type' => 'opponent_listing',
            'opponent_listing_id' => $Listing->id,
        ]);
    }
}
