<?php

it('returns ok inside the data envelope', function () {
    $response = $this->getJson('/api/v1/health');

    $response
        ->assertOk()
        ->assertExactJson([
            'data' => ['status' => 'ok'],
        ]);
});
