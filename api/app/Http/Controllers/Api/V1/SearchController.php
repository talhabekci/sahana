<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlayerPublicResource;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $Request): JsonResponse
    {
        $Query = trim((string) $Request->query('q', ''));
        $Type = $Request->query('type', 'player');

        if ($Query === '') {
            return response()->json(['data' => []]);
        }

        if ($Type === 'team') {
            $Teams = Team::where('name', 'like', "%{$Query}%")->limit(20)->get();

            return response()->json([
                'data' => $Teams->map(fn (Team $Team): array => [
                    'id' => $Team->public_id,
                    'name' => $Team->name,
                    'badge_icon' => $Team->badge_icon,
                    'color_home' => $Team->color_home,
                ]),
            ]);
        }

        $Players = User::whereNotNull('name')
            ->where('name', 'like', "%{$Query}%")
            ->with('profile.city')
            ->limit(20)
            ->get();

        return response()->json(['data' => PlayerPublicResource::collection($Players)]);
    }
}
