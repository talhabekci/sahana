<?php

use App\Models\District;
use App\Models\SosyalhalisahaVenue;
use Illuminate\Support\Facades\Http;

it('bootstraps a session, matches district names and upserts venues', function () {
    Http::fake([
        'sosyalhalisaha.com/filtre' => function ($Request) {
            if ($Request->method() === 'GET') {
                return Http::response('<input type="hidden" name="_token" value="fake-token-123">', 200);
            }

            $Body = [];
            parse_str($Request->body(), $Body);

            if (($Body['type'] ?? null) === 'getdistrict' && ($Body['city'] ?? null) == 34) {
                return Http::response([
                    'status' => 'success',
                    'data' => [['id' => 415, 'name' => 'KADIKÖY']],
                ]);
            }

            if (($Body['type'] ?? null) === 'getplace' && ($Body['district'] ?? null) == 415) {
                return Http::response([
                    'status' => 'success',
                    'data' => [['id' => 1616, 'title' => 'Test Halı Saha']],
                ]);
            }

            return Http::response(['status' => 'success', 'data' => []]);
        },
    ]);

    $this->artisan('sosyalhalisaha:sync --delay-ms=0')->assertSuccessful();

    $District = District::where('city_id', 34)->where('name', 'Kadıköy')->firstOrFail();
    expect($District->external_id)->toBe(415);

    $Venue = SosyalhalisahaVenue::where('district_id', $District->id)->first();
    expect($Venue)->not->toBeNull()
        ->and($Venue->external_id)->toBe(1616)
        ->and($Venue->name)->toBe('Test Halı Saha');
});

it('leaves external_id null for districts with no match in the remote directory', function () {
    Http::fake([
        'sosyalhalisaha.com/filtre' => Http::response('<input type="hidden" name="_token" value="fake-token-123">', 200),
    ]);

    $this->artisan('sosyalhalisaha:sync --delay-ms=0')->assertSuccessful();

    $District = District::where('city_id', 34)->where('name', 'Kadıköy')->firstOrFail();
    expect($District->external_id)->toBeNull();
    expect(SosyalhalisahaVenue::count())->toBe(0);
});
