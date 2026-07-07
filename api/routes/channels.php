<?php

use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Modül 7: takım sohbeti — yetki, takım üyesi olmak (spec: 07-notifications-chat.md).
// Not: public_id (ULID) ile — mobil de team_id yerine public_id biliyor/kullanıyor.
Broadcast::channel('team.{TeamPublicId}', function (User $User, string $TeamPublicId) {
    $Team = Team::where('public_id', $TeamPublicId)->first();

    if ($Team === null || ! $Team->isMember($User)) {
        return false;
    }

    return ['id' => $User->public_id, 'name' => $User->name];
});

// Modül 7: DM — yetki, kanaldaki iki taraftan biri olmak. Kanal adı iki
// public_id'nin alfabetik sıralamasıyla kurulur (bkz. SendDirectMessage).
Broadcast::channel('dm.{PublicIdA}.{PublicIdB}', function (User $User, string $PublicIdA, string $PublicIdB) {
    if ($User->public_id !== $PublicIdA && $User->public_id !== $PublicIdB) {
        return false;
    }

    return ['id' => $User->public_id, 'name' => $User->name];
});
