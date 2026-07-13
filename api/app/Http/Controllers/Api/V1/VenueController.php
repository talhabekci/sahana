<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\VenueResource;
use App\Models\Venue;
use App\Support\Geo;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VenueController extends Controller
{
    /** Rehber: near/radius/search filtreleri (spec: 08-venues.md §API). */
    public function index(Request $Request): AnonymousResourceCollection
    {
        // BACKLOG #62: venues artık sosyalhalisaha eşleşmelerini de barındırıyor
        // (type=sosyalhalisaha) — bunların lat/lng'i yok, rehberde görünmemeli.
        $Query = Venue::query()->where('type', 'internal')->withCount('reviews')->withAvg('reviews', 'score');

        $Search = $Request->query('search');

        if (is_string($Search) && $Search !== '') {
            $Query->where('name', 'like', "%{$Search}%");
        }

        $Coordinates = $this->parseNear($Request->query('near'));
        $RadiusKm = min(100.0, max(1.0, (float) $Request->query('radius', '10')));

        if ($Coordinates !== null) {
            $Box = Geo::boundingBox($Coordinates['lat'], $Coordinates['lng'], $RadiusKm);
            $Query->whereBetween('lat', [$Box['minLat'], $Box['maxLat']])
                ->whereBetween('lng', [$Box['minLng'], $Box['maxLng']]);
        }

        $Venues = $Query->limit(100)->get();

        if ($Coordinates !== null) {
            $Venues = $Venues
                ->each(function (Venue $Venue) use ($Coordinates): void {
                    $Venue->setAttribute(
                        'distance_km',
                        Geo::distanceKm($Coordinates['lat'], $Coordinates['lng'], $Venue->lat, $Venue->lng),
                    );
                })
                ->filter(fn (Venue $Venue): bool => (float) $Venue->getAttribute('distance_km') <= $RadiusKm)
                ->sortBy(fn (Venue $Venue): float => (float) $Venue->getAttribute('distance_km'))
                ->values();
        }

        return VenueResource::collection($Venues->take(50)->values());
    }

    public function show(Venue $Venue): VenueResource
    {
        abort_if($Venue->type !== 'internal', 404);

        $Venue->loadCount('reviews')->loadAvg('reviews', 'score');
        $Venue->load(['reviews' => fn ($Builder) => $Builder->with('user')->latest()->limit(20)]);

        return new VenueResource($Venue);
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
