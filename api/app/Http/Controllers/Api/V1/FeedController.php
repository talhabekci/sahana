<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Social\BuildFeed;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedController extends Controller
{
    public function index(Request $Request, BuildFeed $Action): JsonResponse
    {
        /** @var User $Viewer */
        $Viewer = $Request->user();

        $Paginator = $Action->handle($Viewer, $Request->query('cursor'));

        return response()->json([
            'data' => PostResource::collection($Paginator->items()),
            'meta' => [
                'next_cursor' => $Paginator->nextCursor()?->encode(),
                'per_page' => $Paginator->perPage(),
            ],
        ]);
    }
}
