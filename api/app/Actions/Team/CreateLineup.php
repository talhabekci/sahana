<?php

namespace App\Actions\Team;

use App\Models\Lineup;
use App\Models\Team;
use App\Models\User;

class CreateLineup
{
    public function __construct(private readonly ResolveLineupPositions $ResolvePositions) {}

    /**
     * @param  array{name: string, formation?: string|null, positions: array<int, array<string, mixed>>}  $Data
     */
    public function handle(Team $Team, User $Creator, array $Data): Lineup
    {
        return $Team->lineups()->create([
            'name' => $Data['name'],
            'formation' => $Data['formation'] ?? null,
            'positions' => $this->ResolvePositions->handle($Team, $Data['positions']),
            'created_by' => $Creator->id,
        ]);
    }
}
