<?php

it('serves the landing page', function () {
    $response = $this->get('/');

    $response
        ->assertStatus(200)
        ->assertSee('Sahana')
        ->assertSee('İlk erişime katıl');
});
