<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDeviceRequest;
use App\Models\Device;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DeviceController extends Controller
{
    /** Idempotent upsert — aynı token tekrar gönderilirse sadece sahibi güncellenir. */
    public function store(StoreDeviceRequest $Request): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();

        Device::updateOrCreate(
            ['expo_push_token' => $Request->validated('expo_push_token')],
            ['user_id' => $User->id, 'platform' => $Request->validated('platform')],
        );

        return response()->json(['data' => ['status' => 'registered']], 201);
    }
}
