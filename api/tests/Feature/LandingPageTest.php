<?php

it('serves the Turkish landing page by default', function () {
    $response = $this->get('/');

    $response
        ->assertStatus(200)
        ->assertSee('Sahana')
        ->assertSee('İlk erişime katıl');
});

it('serves the English landing page at /en', function () {
    $response = $this->get('/en');

    $response
        ->assertStatus(200)
        ->assertSee('Sahana')
        ->assertSee('Get early access');
});
