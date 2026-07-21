<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use App\Notifications\PostLikedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class PostLikeController extends Controller
{
    /** Idempotent: zaten beğenilmişse tekrar istek durumu bozmaz. */
    public function store(Request $Request, Post $Post): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();

        $Like = Like::firstOrCreate(['post_id' => $Post->id, 'user_id' => $User->id]);

        if ($Like->wasRecentlyCreated && $Post->user_id !== $User->id) {
            Notification::send($Post->user, new PostLikedNotification($Post, $User));
        }

        return response()->json(['data' => ['status' => 'liked']]);
    }

    public function destroy(Request $Request, Post $Post): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();

        Like::where('post_id', $Post->id)->where('user_id', $User->id)->delete();

        return response()->json(['data' => ['status' => 'unliked']]);
    }
}
