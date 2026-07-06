<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiError;
use App\Http\Controllers\Controller;
use App\Models\Block;
use App\Models\Follow;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BlockController extends Controller
{
    public function store(Request $Request, string $PublicId): JsonResponse
    {
        /** @var User $Viewer */
        $Viewer = $Request->user();

        $Target = User::where('public_id', $PublicId)->firstOrFail();

        if ($Target->id === $Viewer->id) {
            throw new ApiError('Kendini engelleyemezsin.', 'cannot_block_self', 422);
        }

        DB::transaction(function () use ($Viewer, $Target): void {
            Block::firstOrCreate(['user_id' => $Viewer->id, 'blocked_user_id' => $Target->id]);

            // Engelleme karşılıklı görünürlüğü keser — takip ilişkileri de temizlenir.
            Follow::where('follower_id', $Viewer->id)->where('followed_id', $Target->id)->delete();
            Follow::where('follower_id', $Target->id)->where('followed_id', $Viewer->id)->delete();
        });

        return response()->json(['data' => ['status' => 'blocked']]);
    }

    public function destroy(Request $Request, string $PublicId): JsonResponse
    {
        /** @var User $Viewer */
        $Viewer = $Request->user();

        $Target = User::where('public_id', $PublicId)->firstOrFail();

        Block::where('user_id', $Viewer->id)->where('blocked_user_id', $Target->id)->delete();

        return response()->json(['data' => ['status' => 'unblocked']]);
    }
}
