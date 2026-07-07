<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $Request): AnonymousResourceCollection
    {
        /** @var User $User */
        $User = $Request->user();

        $Cursor = $Request->query('cursor');

        return NotificationResource::collection(
            $User->notifications()->cursorPaginate(20, ['*'], 'cursor', $Cursor),
        );
    }

    public function read(Request $Request, DatabaseNotification $Notification): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();

        if ($Notification->notifiable_type !== User::class || $Notification->notifiable_id !== $User->id) {
            abort(404);
        }

        $Notification->markAsRead();

        return response()->json(['data' => ['status' => 'read']]);
    }

    public function readAll(Request $Request): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();

        $User->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['data' => ['status' => 'read']]);
    }
}
