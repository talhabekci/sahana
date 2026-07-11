<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\District;
use Illuminate\Http\JsonResponse;

class CityController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => City::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /** İlçe seçici (BACKLOG #51) — seed sırası zaten Türkçe alfabetik. */
    public function districts(City $City): JsonResponse
    {
        return response()->json([
            'data' => District::query()->where('city_id', $City->id)->orderBy('id')->get(['id', 'name']),
        ]);
    }
}
