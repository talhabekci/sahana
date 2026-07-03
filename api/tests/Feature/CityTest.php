<?php

it('lists all 81 cities', function () {
    $Response = $this->getJson('/api/v1/cities')->assertOk();

    expect($Response->json('data'))->toHaveCount(81)
        ->and(collect($Response->json('data'))->pluck('name'))->toContain('İstanbul');
});
