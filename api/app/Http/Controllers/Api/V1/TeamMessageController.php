<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Chat\ListMessages;
use App\Actions\Chat\SendMessage;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMessageRequest;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamMessageController extends Controller
{
    public function index(Request $Request, Team $Team, ListMessages $Action): JsonResponse
    {
        $this->authorize('view', $Team);

        $Result = $Action->handle(
            $Team,
            $Request->query('before'),
            (int) $Request->query('limit', 30),
        );

        return response()->json([
            'data' => $Result['data'],
            'meta' => ['next_cursor' => $Result['next_cursor']],
        ]);
    }

    public function store(StoreMessageRequest $Request, Team $Team, SendMessage $Action): JsonResponse
    {
        $this->authorize('view', $Team);

        /** @var User $Sender */
        $Sender = $Request->user();

        $Payload = $Action->handle($Team, $Sender, $Request->validated());

        return response()->json(['data' => $Payload], 201);
    }
}
