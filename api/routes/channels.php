<?php

use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Modül 7: takım sohbeti — yetki, takım üyesi olmak (spec: 07-notifications-chat.md).
Broadcast::channel('team.{TeamId}', function (User $User, int $TeamId) {
    $Team = Team::find($TeamId);

    if ($Team === null || ! $Team->isMember($User)) {
        return false;
    }

    return ['id' => $User->public_id, 'name' => $User->name];
});
