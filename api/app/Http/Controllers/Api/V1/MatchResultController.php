<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Stats\ConfirmMatchResult;
use App\Actions\Stats\DisputeMatchResult;
use App\Actions\Stats\EnterMatchResult;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMatchResultRequest;
use App\Http\Resources\MatchResource;
use App\Models\FootballMatch;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MatchResultController extends Controller
{
    private const RELATIONS = ['team.members', 'opponentTeam.members', 'result'];

    public function store(StoreMatchResultRequest $Request, FootballMatch $Match, EnterMatchResult $Action): JsonResponse
    {
        $this->authorize('enterResult', $Match);

        /** @var User $Captain */
        $Captain = $Request->user();

        $Action->handle(
            $Match,
            $Captain,
            (int) $Request->validated('home_score'),
            (int) $Request->validated('away_score'),
            $Request->validated('no_show_user_ids', []),
        );

        return (new MatchResource($Match->fresh(self::RELATIONS)))->response()->setStatusCode(201);
    }

    public function confirm(Request $Request, FootballMatch $Match, ConfirmMatchResult $Action): MatchResource
    {
        $this->authorize('confirmResult', $Match);

        /** @var User $Captain */
        $Captain = $Request->user();

        $Action->handle($Match, $Captain);

        return new MatchResource($Match->fresh(self::RELATIONS));
    }

    public function dispute(Request $Request, FootballMatch $Match, DisputeMatchResult $Action): MatchResource
    {
        $this->authorize('disputeResult', $Match);

        /** @var User $Captain */
        $Captain = $Request->user();

        $Action->handle($Match, $Captain);

        return new MatchResource($Match->fresh(self::RELATIONS));
    }
}
