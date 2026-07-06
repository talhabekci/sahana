<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Video;

class VideoPolicy
{
    /** Ekleyen ya da maçın takım kaptanı silebilir. */
    public function delete(User $User, Video $Video): bool
    {
        if ($Video->user_id === $User->id) {
            return true;
        }

        return $Video->match->isCaptain($User);
    }
}
