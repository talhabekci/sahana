<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Stats\SubmitRating;
use App\Http\Controllers\Controller;
use App\Http\Requests\SubmitRatingRequest;
use App\Models\FootballMatch;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class PlayerRatingController extends Controller
{
    public function store(SubmitRatingRequest $Request, FootballMatch $Match, SubmitRating $Action): JsonResponse
    {
        $this->authorize('rate', $Match);

        /** @var User $Rater */
        $Rater = $Request->user();

        $Ratee = User::where('public_id', $Request->validated('ratee_id'))->firstOrFail();

        $Action->handle($Match, $Rater, $Ratee, (int) $Request->validated('score'));

        return response()->json(['data' => ['status' => 'rated']]);
    }
}
