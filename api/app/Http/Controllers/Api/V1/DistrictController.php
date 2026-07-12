<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\District;
use Illuminate\Http\JsonResponse;

class DistrictController extends Controller
{
    /**
     * Maç kurma akışındaki opsiyonel "Sosyal Halı Saha'da bulunsun mu?"
     * seçicisi için — sadece eşleşmiş sahalar (BACKLOG #58).
     */
    public function sosyalhalisahaVenues(District $District): JsonResponse
    {
        return response()->json([
            'data' => $District->sosyalhalisahaVenues()->orderBy('name')->get(['id', 'name']),
        ]);
    }
}
