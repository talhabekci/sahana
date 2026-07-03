<?php

namespace App\Actions\Team;

use App\Models\Team;
use App\Models\TeamInvite;
use App\Models\User;
use Illuminate\Support\Str;

class GenerateTeamInvite
{
    /**
     * @param  array{expires_at?: string|null, max_uses?: int|null}  $Data
     */
    public function handle(Team $Team, User $Creator, array $Data = []): TeamInvite
    {
        do {
            $Code = strtoupper(Str::random(8));
        } while (TeamInvite::where('code', $Code)->exists());

        return $Team->invites()->create([
            'code' => $Code,
            'created_by' => $Creator->id,
            'expires_at' => $Data['expires_at'] ?? null,
            'max_uses' => $Data['max_uses'] ?? null,
        ]);
    }
}
