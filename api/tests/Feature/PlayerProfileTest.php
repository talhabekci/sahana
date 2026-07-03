<?php

use App\Models\PlayerProfile;
use App\Models\User;

it('shows a public player profile without contact info', function () {
    $User = User::factory()->create(['name' => 'Ali Oyuncu']);
    PlayerProfile::factory()->for($User)->create(['city_id' => 6]);

    $this->getJson('/api/v1/players/'.$User->public_id)
        ->assertOk()
        ->assertJsonPath('data.name', 'Ali Oyuncu')
        ->assertJsonPath('data.profile.city', 'Ankara')
        ->assertJsonMissingPath('data.email')
        ->assertJsonMissingPath('data.phone');
});

it('returns 404 for an unknown player', function () {
    $this->getJson('/api/v1/players/00000000000000000000000000')
        ->assertStatus(404)
        ->assertJsonPath('code', 'not_found');
});

it('returns 404 for a soft deleted player', function () {
    $User = User::factory()->create();
    $PublicId = $User->public_id;

    $User->delete();

    $this->getJson('/api/v1/players/'.$PublicId)->assertStatus(404);
});
