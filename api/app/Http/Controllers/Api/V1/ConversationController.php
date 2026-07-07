<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Chat\ListConversations;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $Request, ListConversations $Action): JsonResponse
    {
        /** @var User $Me */
        $Me = $Request->user();

        return response()->json(['data' => $Action->handle($Me)]);
    }
}
