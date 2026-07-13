<?php

use App\Models\District;
use App\Models\Venue;

it('lists all 81 cities', function () {
    $Response = $this->getJson('/api/v1/cities')->assertOk();

    expect($Response->json('data'))->toHaveCount(81)
        ->and(collect($Response->json('data'))->pluck('name'))->toContain('İstanbul');
});

it('lists the districts of a city', function () {
    $Response = $this->getJson('/api/v1/cities/34/districts')->assertOk();

    expect($Response->json('data'))->toHaveCount(39)
        ->and(collect($Response->json('data'))->pluck('name'))->toContain('Kadıköy');
});

it('lists matched sosyalhalisaha venues for a district', function () {
    $District = District::where('city_id', 34)->where('name', 'Kadıköy')->firstOrFail();
    $District->forceFill(['external_id' => 415])->save();
    Venue::factory()->sosyalhalisaha($District->id, 1616)->create(['name' => 'Test Saha']);

    $Response = $this->getJson("/api/v1/districts/{$District->id}/sosyalhalisaha-venues")->assertOk();

    expect(collect($Response->json('data'))->pluck('name'))->toContain('Test Saha');
});

it('returns an empty list for a district with no sosyalhalisaha match', function () {
    $District = District::where('city_id', 6)->first();

    $this->getJson("/api/v1/districts/{$District->id}/sosyalhalisaha-venues")
        ->assertOk()
        ->assertJsonPath('data', []);
});
