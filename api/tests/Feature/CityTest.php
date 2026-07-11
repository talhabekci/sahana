<?php

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
