<?php

namespace App\Support;

/**
 * v1 konum yardımcıları — spec kararı (03-match-organization.md §Veri Modeli):
 * bounding-box ile DB filtreleme + PHP'de haversine sıralama.
 */
class Geo
{
    private const EARTH_RADIUS_KM = 6371.0;

    private const KM_PER_DEGREE_LAT = 111.32;

    /**
     * @return array{minLat: float, maxLat: float, minLng: float, maxLng: float}
     */
    public static function boundingBox(float $Lat, float $Lng, float $RadiusKm): array
    {
        $DeltaLat = $RadiusKm / self::KM_PER_DEGREE_LAT;
        $DeltaLng = $RadiusKm / (self::KM_PER_DEGREE_LAT * max(cos(deg2rad($Lat)), 0.01));

        return [
            'minLat' => $Lat - $DeltaLat,
            'maxLat' => $Lat + $DeltaLat,
            'minLng' => $Lng - $DeltaLng,
            'maxLng' => $Lng + $DeltaLng,
        ];
    }

    public static function distanceKm(float $LatA, float $LngA, float $LatB, float $LngB): float
    {
        $DLat = deg2rad($LatB - $LatA);
        $DLng = deg2rad($LngB - $LngA);

        $A = sin($DLat / 2) ** 2
            + cos(deg2rad($LatA)) * cos(deg2rad($LatB)) * sin($DLng / 2) ** 2;

        return 2 * self::EARTH_RADIUS_KM * asin(min(1.0, sqrt($A)));
    }
}
