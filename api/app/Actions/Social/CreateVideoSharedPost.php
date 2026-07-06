<?php

namespace App\Actions\Social;

use App\Models\Post;
use App\Models\User;
use App\Models\Video;

class CreateVideoSharedPost
{
    /** Otomatik "video paylaşıldı" kartı; ekleyenin profil ayarına bağlı. */
    public function handle(Video $Video, User $Creator): ?Post
    {
        if ($Creator->profile?->auto_posts_enabled === false) {
            return null;
        }

        return Post::create([
            'user_id' => $Creator->id,
            'team_id' => $Video->match->team_id,
            'type' => 'video_shared',
            'match_id' => $Video->match_id,
            'video_id' => $Video->id,
        ]);
    }
}
