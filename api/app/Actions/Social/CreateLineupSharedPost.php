<?php

namespace App\Actions\Social;

use App\Models\Lineup;
use App\Models\Post;
use App\Models\User;

class CreateLineupSharedPost
{
    /** Otomatik "kadro paylaşıldı" kartı; kurucunun profil ayarına bağlı. */
    public function handle(Lineup $Lineup, User $Creator): ?Post
    {
        if ($Creator->profile?->auto_posts_enabled === false) {
            return null;
        }

        return Post::create([
            'user_id' => $Creator->id,
            'team_id' => $Lineup->team_id,
            'type' => 'lineup_shared',
            'lineup_id' => $Lineup->id,
        ]);
    }
}
