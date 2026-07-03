<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Team\AcceptTeamInvite;
use App\Actions\Team\GenerateTeamInvite;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeamInviteRequest;
use App\Http\Resources\TeamInviteResource;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamInviteController extends Controller
{
    public function store(StoreTeamInviteRequest $Request, Team $Team, GenerateTeamInvite $Action): JsonResponse
    {
        $this->authorize('manageInvites', $Team);

        $Invite = $Action->handle($Team, $Request->user(), $Request->validated());

        return (new TeamInviteResource($Invite))->response()->setStatusCode(201);
    }

    public function accept(Request $Request, string $Code, AcceptTeamInvite $Action): TeamResource
    {
        $Team = $Action->handle($Code, $Request->user());

        return new TeamResource($Team->load('members')->loadCount('members'));
    }
}
