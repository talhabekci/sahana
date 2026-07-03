<?php

namespace App\Actions\Team;

use App\Models\Lineup;

class UpdateLineup
{
    public function __construct(private readonly ResolveLineupPositions $ResolvePositions) {}

    /**
     * @param  array{name?: string, formation?: string|null, positions?: array<int, array<string, mixed>>}  $Data
     */
    public function handle(Lineup $Lineup, array $Data): Lineup
    {
        if (array_key_exists('positions', $Data)) {
            $Data['positions'] = $this->ResolvePositions->handle($Lineup->team, $Data['positions']);
        }

        $Lineup->update($Data);

        return $Lineup;
    }
}
