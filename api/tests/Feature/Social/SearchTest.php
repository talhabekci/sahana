<?php

use App\Models\Team;
use App\Models\User;

it('excludes the viewer from their own player search results', function () {
    $Me = User::factory()->create(['name' => 'Talha Bekçi']);
    $Other = User::factory()->create(['name' => 'Talha Yılmaz']);

    $Response = $this->actingAs($Me)->getJson('/api/v1/search?q=Talha&type=player')->assertOk();

    $Ids = collect($Response->json('data'))->pluck('id');

    expect($Ids)->toContain($Other->public_id)
        ->and($Ids)->not->toContain($Me->public_id);
});

it('lets a user find a team by name', function () {
    $Me = User::factory()->create();
    Team::factory()->create(['name' => 'Kartallar FK']);

    $Response = $this->actingAs($Me)->getJson('/api/v1/search?q=Kartallar&type=team')->assertOk();

    expect(collect($Response->json('data'))->pluck('name'))->toContain('Kartallar FK');
});
