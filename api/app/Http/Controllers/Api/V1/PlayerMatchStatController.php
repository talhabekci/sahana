<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Stats\ApprovePlayerStat;
use App\Actions\Stats\SubmitPlayerStat;
use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitPlayerStatRequest;
use App\Http\Resources\PlayerMatchStatResource;
use App\Models\FootballMatch;
use App\Models\PlayerMatchStat;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlayerMatchStatController extends Controller
{
    public function index(Request $Request, FootballMatch $Match): AnonymousResourceCollection
    {
        $this->authorize('view', $Match);

        return PlayerMatchStatResource::collection($Match->playerStats()->with('user')->get());
    }

    public function store(SubmitPlayerStatRequest $Request, FootballMatch $Match, SubmitPlayerStat $Action): JsonResponse
    {
        $this->authorize('enterStat', $Match);

        /** @var User $Actor */
        $Actor = $Request->user();

        $TargetPlayer = User::where('public_id', $Request->validated('user_id'))->firstOrFail();

        $Stat = $Action->handle(
            $Match,
            $Actor,
            $TargetPlayer,
            (int) $Request->validated('goals'),
            (int) $Request->validated('assists'),
        );

        $Stat->load('user');

        return (new PlayerMatchStatResource($Stat))->response()->setStatusCode(201);
    }

    public function approve(Request $Request, PlayerMatchStat $Stat, ApprovePlayerStat $Action): PlayerMatchStatResource
    {
        $this->authorize('approve', $Stat);

        $Action->handle($Stat);

        return new PlayerMatchStatResource($Stat->fresh('user'));
    }
}
