<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /** Sahibi ya da (takım gönderisiyse) takımın kaptanı silebilir. */
    public function delete(User $User, Post $Post): bool
    {
        if ($Post->user_id === $User->id) {
            return true;
        }

        return $Post->team_id !== null && $Post->team->isCaptain($User);
    }
}
