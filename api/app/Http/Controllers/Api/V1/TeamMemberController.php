<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Team\RemoveTeamMember;
use App\Actions\Team\TransferCaptaincy;
use App\Http\Controllers\Controller;
use App\Http\Requests\TransferCaptaincyRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamMemberController extends Controller
{
    public function destroy(Request $Request, Team $Team, string $UserPublicId, RemoveTeamMember $Action): JsonResponse
    {
        $TargetUser = User::where('public_id', $UserPublicId)->firstOrFail();

        $Action->handle($Team, $Request->user(), $TargetUser);

        return response()->json(['data' => ['status' => 'removed']]);
    }

    public function transferCaptaincy(
        TransferCaptaincyRequest $Request,
        Team $Team,
        TransferCaptaincy $Action,
    ): TeamResource {
        $this->authorize('transferCaptaincy', $Team);

        $NewCaptain = User::where('public_id', $Request->validated('user_id'))->firstOrFail();

        $Action->handle($Team, $Request->user(), $NewCaptain);

        return new TeamResource($Team->fresh('members')->loadCount('members'));
    }
}
