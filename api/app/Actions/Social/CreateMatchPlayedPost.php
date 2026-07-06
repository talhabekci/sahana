<?php

namespace App\Actions\Social;

use App\Models\FootballMatch;
use App\Models\Post;

class CreateMatchPlayedPost
{
    /**
     * Otomatik "maç oynandı" kartı — skor yok (Modül 6'nın kancası).
     * Maç kaptanının profil ayarı `auto_posts_enabled=false` ise atlanır.
     */
    public function handle(FootballMatch $Match): ?Post
    {
        $Creator = $Match->createdBy;

        if ($Creator === null || $Creator->profile?->auto_posts_enabled === false) {
            return null;
        }

        return Post::create([
            'user_id' => $Creator->id,
            'team_id' => $Match->team_id,
            'type' => 'match_played',
            'match_id' => $Match->id,
        ]);
    }
}
