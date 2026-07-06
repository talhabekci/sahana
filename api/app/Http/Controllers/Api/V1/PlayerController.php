<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Stats\BuildPlayerStats;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlayerPublicResource;
use App\Http\Resources\PostResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlayerController extends Controller
{
    public function show(string $PublicId): PlayerPublicResource
    {
        $User = User::query()
            ->where('public_id', $PublicId)
            ->with('profile.city')
            ->withCount(['followers', 'following'])
            ->firstOrFail();

        return new PlayerPublicResource($User);
    }

    /** Oyuncunun herkese açık gönderileri (engel varsa 404 gibi davranır). */
    public function posts(Request $Request, string $PublicId): AnonymousResourceCollection
    {
        /** @var User $Viewer */
        $Viewer = $Request->user();

        $User = User::where('public_id', $PublicId)->firstOrFail();

        if ($Viewer->isBlockedWith($User)) {
            abort(404);
        }

        $Posts = $User->posts()
            ->with(['user.profile', 'team', 'match.opponentTeam', 'lineup', 'video'])
            ->withCount(['likes', 'comments'])
            ->latest()
            ->limit(30)
            ->get();

        return PostResource::collection($Posts);
    }

    /** Sezon istatistik özeti (Modül 6): maç/gol/asist, zaman ağırlıklı reyting, güvenilirlik. */
    public function stats(Request $Request, string $PublicId, BuildPlayerStats $Action): JsonResponse
    {
        $Player = User::where('public_id', $PublicId)->firstOrFail();
        $Season = (int) $Request->query('season', (string) now()->year);

        return response()->json(['data' => $Action->handle($Player, $Season)]);
    }
}
