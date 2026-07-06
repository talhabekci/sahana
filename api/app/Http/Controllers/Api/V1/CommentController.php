<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiError;
use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function destroy(Request $Request, Comment $Comment): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();

        if ($Comment->user_id !== $User->id) {
            throw new ApiError('Bu yorumu silemezsin.', 'forbidden', 403);
        }

        $Comment->delete();

        return response()->json(['data' => ['status' => 'deleted']]);
    }
}
