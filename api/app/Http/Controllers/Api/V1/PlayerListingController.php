<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Match\CreatePlayerListing;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePlayerListingRequest;
use App\Http\Resources\PlayerListingResource;
use App\Models\FootballMatch;
use App\Models\ListingApplication;
use App\Models\PlayerListing;
use App\Models\User;
use App\Support\Geo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PlayerListingController extends Controller
{
    public function store(
        StorePlayerListingRequest $Request,
        FootballMatch $Match,
        CreatePlayerListing $Action,
    ): JsonResponse {
        $this->authorize('manage', $Match);

        /** @var array{positions_needed: list<string>, needed_count: int, level_min: int, level_max: int, lat: float, lng: float} $Data */
        $Data = $Request->validated();

        $Listing = $Action->handle($Match, $Data);
        $Listing->load('match.team');

        return (new PlayerListingResource($Listing))->response()->setStatusCode(201);
    }

    /** Keşif: spec §API — near/radius/position/date filtreleri. */
    public function index(Request $Request): AnonymousResourceCollection
    {
        /** @var User $User */
        $User = $Request->user();

        $Coordinates = $this->parseNear($Request->query('near'));
        $RadiusKm = min(100.0, max(1.0, (float) $Request->query('radius', '10')));

        $Query = PlayerListing::query()
            ->where('status', 'open')
            ->where('expires_at', '>', now())
            ->with('match.team');

        if ($Coordinates !== null) {
            $Box = Geo::boundingBox($Coordinates['lat'], $Coordinates['lng'], $RadiusKm);

            // Konumu olmayan ilan yarıçap filtresine takılıp kaybolmamalı (BACKLOG #45).
            $Query->where(function ($Sub) use ($Box): void {
                $Sub->whereNull('lat')->orWhere(function ($Geo) use ($Box): void {
                    $Geo->whereBetween('lat', [$Box['minLat'], $Box['maxLat']])
                        ->whereBetween('lng', [$Box['minLng'], $Box['maxLng']]);
                });
            });
        }

        $Date = $Request->query('date');

        if (is_string($Date) && $Date !== '') {
            $Query->whereHas('match', fn ($Builder) => $Builder->whereDate('starts_at', $Date));
        }

        $Listings = $Query->limit(100)->get();

        $Position = $Request->query('position');

        if (is_string($Position) && $Position !== '') {
            $Listings = $Listings
                ->filter(fn (PlayerListing $Listing): bool => in_array($Position, $Listing->positions_needed, true))
                ->values();
        }

        if ($Coordinates !== null) {
            $Listings = $Listings
                ->each(function (PlayerListing $Listing) use ($Coordinates): void {
                    $Listing->setAttribute(
                        'distance_km',
                        Geo::distanceKm($Coordinates['lat'], $Coordinates['lng'], $Listing->lat, $Listing->lng),
                    );
                })
                ->filter(fn (PlayerListing $Listing): bool => (float) $Listing->getAttribute('distance_km') <= $RadiusKm)
                ->sortBy(fn (PlayerListing $Listing): float => (float) $Listing->getAttribute('distance_km'))
                ->values();
        }

        $Listings = $Listings->take(50)->values();

        $MyStatuses = ListingApplication::whereIn('listing_id', $Listings->pluck('id'))
            ->where('user_id', $User->id)
            ->pluck('status', 'listing_id');

        $Listings->each(function (PlayerListing $Listing) use ($MyStatuses): void {
            $Listing->setAttribute('my_application_status', $MyStatuses[$Listing->id] ?? null);
        });

        return PlayerListingResource::collection($Listings);
    }

    public function show(Request $Request, PlayerListing $Listing): PlayerListingResource
    {
        /** @var User $User */
        $User = $Request->user();

        $Listing->load('match.team.members');

        if ($Listing->match->isCaptain($User)) {
            $Listing->load('applications.user');
        } else {
            $Listing->setAttribute(
                'my_application_status',
                $Listing->applications()->where('user_id', $User->id)->value('status'),
            );
        }

        return new PlayerListingResource($Listing);
    }

    /**
     * @return array{lat: float, lng: float}|null
     */
    private function parseNear(mixed $Near): ?array
    {
        if (! is_string($Near) || preg_match('/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/', $Near) !== 1) {
            return null;
        }

        [$Lat, $Lng] = array_map(floatval(...), explode(',', $Near));

        return ['lat' => $Lat, 'lng' => $Lng];
    }
}
