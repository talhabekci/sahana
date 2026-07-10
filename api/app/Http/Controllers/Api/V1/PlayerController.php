<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Stats\BuildPlayerStats;
use App\Http\Controllers\Controller;
use App\Http\Resources\PlayerPublicResource;
use App\Http\Resources\PostResource;
use App\Models\ListingApplication;
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
            ->with([
                'user.profile', 'team', 'match.opponentTeam', 'lineup.team.members', 'video',
                'playerListing.match.team', 'opponentListing.team',
            ])
            ->withCount(['likes', 'comments'])
            ->latest()
            ->limit(30)
            ->get();

        // Sadece görüntüleyenin kendi başvuru durumu, tek bir batch sorguyla (N+1 yok).
        $ListingIds = $Posts->pluck('playerListing.id')->filter()->unique();

        if ($ListingIds->isNotEmpty()) {
            $MyStatuses = ListingApplication::whereIn('listing_id', $ListingIds)
                ->where('user_id', $Viewer->id)
                ->pluck('status', 'listing_id');

            foreach ($Posts as $Post) {
                $Post->playerListing?->setAttribute(
                    'my_application_status',
                    $MyStatuses[$Post->playerListing->id] ?? null,
                );
            }
        }

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
