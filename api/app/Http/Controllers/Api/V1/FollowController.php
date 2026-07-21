<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiError;
use App\Http\Controllers\Controller;
use App\Models\Follow;
use App\Models\User;
use App\Notifications\FollowedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class FollowController extends Controller
{
    public function store(Request $Request, string $PublicId): JsonResponse
    {
        /** @var User $Viewer */
        $Viewer = $Request->user();

        $Target = User::where('public_id', $PublicId)->firstOrFail();

        if ($Target->id === $Viewer->id) {
            throw new ApiError('Kendini takip edemezsin.', 'cannot_follow_self', 422);
        }

        $Follow = Follow::firstOrCreate(['follower_id' => $Viewer->id, 'followed_id' => $Target->id]);

        if ($Follow->wasRecentlyCreated) {
            Notification::send($Target, new FollowedNotification($Viewer));
        }

        return response()->json(['data' => ['status' => 'following']]);
    }

    public function destroy(Request $Request, string $PublicId): JsonResponse
    {
        /** @var User $Viewer */
        $Viewer = $Request->user();

        $Target = User::where('public_id', $PublicId)->firstOrFail();

        Follow::where('follower_id', $Viewer->id)->where('followed_id', $Target->id)->delete();

        return response()->json(['data' => ['status' => 'unfollowed']]);
    }
}
