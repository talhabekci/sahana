<?php

namespace App\Actions\Team;

use App\Exceptions\ApiError;
use App\Models\Team;
use App\Models\TeamInvite;
use App\Models\User;
use App\Notifications\InviteAcceptedNotification;
use Illuminate\Support\Facades\DB;

class AcceptTeamInvite
{
    public function handle(string $Code, User $User): Team
    {
        /** @var TeamInvite|null $Invite */
        $Invite = TeamInvite::where('code', $Code)->first();

        if ($Invite === null) {
            throw new ApiError('Davet kodu geçersiz.', 'invite_not_found', 404);
        }

        if ($Invite->isExpired()) {
            throw new ApiError('Davetin süresi dolmuş.', 'invite_expired', 422);
        }

        if ($Invite->isExhausted()) {
            throw new ApiError('Davet kullanım limitine ulaşmış.', 'invite_exhausted', 422);
        }

        $Team = $Invite->team;

        if ($Team->isMember($User)) {
            return $Team->fresh('members');
        }

        DB::transaction(function () use ($Team, $User, $Invite): void {
            $Team->members()->attach($User->id, [
                'role' => 'member',
                'joined_at' => now(),
            ]);

            $Invite->increment('uses_count');
        });

        $Captain = $Team->captain();

        if ($Captain !== null) {
            $Captain->notify(new InviteAcceptedNotification($Team, $User));
        }

        return $Team->fresh('members');
    }
}
