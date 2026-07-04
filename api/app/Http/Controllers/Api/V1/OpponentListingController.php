<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Match\CreateOpponentListing;
use App\Actions\Match\MatchOpponentListing;
use App\Exceptions\ApiError;
use App\Http\Controllers\Controller;
use App\Http\Requests\MatchOpponentRequest;
use App\Http\Requests\StoreOpponentListingRequest;
use App\Http\Resources\OpponentListingResource;
use App\Models\FootballMatch;
use App\Models\OpponentListing;
use App\Models\Team;
use App\Models\User;
use App\Support\Geo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OpponentListingController extends Controller
{
    public function store(StoreOpponentListingRequest $Request, CreateOpponentListing $Action): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();

        $Team = Team::where('public_id', $Request->validated('team_id'))->firstOrFail();

        $MatchId = null;
        $MatchPublicId = $Request->validated('match_id');

        if ($MatchPublicId !== null) {
            $Match = FootballMatch::where('public_id', $MatchPublicId)->firstOrFail();

            if ($Match->team_id !== $Team->id) {
                throw new ApiError('Maç bu takıma ait değil.', 'match_team_mismatch');
            }

            $MatchId = $Match->id;
        }

        $Listing = $Action->handle($Team, $User, [
            'match_id' => $MatchId,
            'note' => $Request->validated('note'),
            'lat' => $Request->validated('lat'),
            'lng' => $Request->validated('lng'),
        ]);

        $Listing->load(['team', 'match']);

        return (new OpponentListingResource($Listing))->response()->setStatusCode(201);
    }

    public function index(Request $Request): AnonymousResourceCollection
    {
        $Query = OpponentListing::query()
            ->where('status', 'open')
            ->with(['team', 'match'])
            ->latest();

        $Near = $Request->query('near');

        if (is_string($Near) && preg_match('/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/', $Near) === 1) {
            [$Lat, $Lng] = array_map(floatval(...), explode(',', $Near));
            $RadiusKm = min(100.0, max(1.0, (float) $Request->query('radius', '25')));
            $Box = Geo::boundingBox($Lat, $Lng, $RadiusKm);

            $Query->whereBetween('lat', [$Box['minLat'], $Box['maxLat']])
                ->whereBetween('lng', [$Box['minLng'], $Box['maxLng']]);
        }

        return OpponentListingResource::collection($Query->limit(50)->get());
    }

    public function matchListing(
        MatchOpponentRequest $Request,
        OpponentListing $Listing,
        MatchOpponentListing $Action,
    ): OpponentListingResource {
        /** @var User $User */
        $User = $Request->user();

        $Team = Team::where('public_id', $Request->validated('team_id'))->firstOrFail();

        return new OpponentListingResource($Action->handle($Listing, $Team, $User));
    }
}
