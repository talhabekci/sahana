<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Team\CreateLineup;
use App\Actions\Team\UpdateLineup;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLineupRequest;
use App\Http\Requests\UpdateLineupRequest;
use App\Http\Resources\LineupResource;
use App\Models\Lineup;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LineupController extends Controller
{
    public function index(Team $Team): AnonymousResourceCollection
    {
        $this->authorize('manageLineups', $Team);

        $Team->loadMissing('members');

        $Lineups = $Team->lineups()->latest()->get()
            ->each(fn (Lineup $Lineup) => $Lineup->setRelation('team', $Team));

        return LineupResource::collection($Lineups);
    }

    public function store(StoreLineupRequest $Request, Team $Team, CreateLineup $Action): JsonResponse
    {
        $this->authorize('manageLineups', $Team);

        $Team->loadMissing('members');

        $Lineup = $Action->handle($Team, $Request->user(), $Request->validated());
        $Lineup->setRelation('team', $Team);

        return (new LineupResource($Lineup))->response()->setStatusCode(201);
    }

    public function show(Lineup $Lineup): LineupResource
    {
        $Lineup->loadMissing('team.members');

        $this->authorize('manageLineups', $Lineup->team);

        return new LineupResource($Lineup);
    }

    public function update(UpdateLineupRequest $Request, Lineup $Lineup, UpdateLineup $Action): LineupResource
    {
        $Lineup->loadMissing('team.members');

        $this->authorize('manageLineups', $Lineup->team);

        $Updated = $Action->handle($Lineup, $Request->validated());
        $Updated->setRelation('team', $Lineup->team);

        return new LineupResource($Updated);
    }
}
