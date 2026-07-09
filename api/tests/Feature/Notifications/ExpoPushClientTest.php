<?php

use App\Models\Device;
use App\Support\ExpoPushClient;
use Illuminate\Support\Facades\Http;

it('deletes the device when Expo reports DeviceNotRegistered', function () {
    $Device = Device::factory()->create();

    Http::fake([
        'exp.host/*' => Http::response([
            'data' => [
                ['status' => 'error', 'message' => 'not a valid Expo push token', 'details' => ['error' => 'DeviceNotRegistered']],
            ],
        ]),
    ]);

    (new ExpoPushClient)->send([$Device->expo_push_token], 'Başlık', 'Mesaj');

    expect(Device::find($Device->id))->toBeNull();
});

it('keeps the device when Expo reports ok', function () {
    $Device = Device::factory()->create();

    Http::fake([
        'exp.host/*' => Http::response(['data' => [['status' => 'ok', 'id' => 'ticket-id']]]),
    ]);

    (new ExpoPushClient)->send([$Device->expo_push_token], 'Başlık', 'Mesaj');

    expect(Device::find($Device->id))->not->toBeNull();
});

it('keeps the device on a non-DeviceNotRegistered error', function () {
    $Device = Device::factory()->create();

    Http::fake([
        'exp.host/*' => Http::response([
            'data' => [
                ['status' => 'error', 'message' => 'rate limited', 'details' => ['error' => 'MessageRateExceeded']],
            ],
        ]),
    ]);

    (new ExpoPushClient)->send([$Device->expo_push_token], 'Başlık', 'Mesaj');

    expect(Device::find($Device->id))->not->toBeNull();
});
