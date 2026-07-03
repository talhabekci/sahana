<?php

use App\Models\Team;
use App\Models\User;

function createTeamWithCaptain(): array
{
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    return [$Team, $Captain];
}

it('creates a lineup with a team member and a guest', function () {
    [$Team, $Captain] = createTeamWithCaptain();
    $Member = User::factory()->create(['name' => 'Yedek Oyuncu']);
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $Response = $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/lineups", [
        'name' => 'Perşembe Maçı',
        'formation' => '2-3-1',
        'positions' => [
            ['id' => 'gk', 'x' => 0.5, 'y' => 0.95, 'label' => 'GK', 'user_id' => $Member->public_id],
            ['id' => 'fw', 'x' => 0.5, 'y' => 0.1, 'label' => 'FW', 'guest_name' => 'Misafir Oyuncu'],
        ],
    ])->assertCreated();

    expect($Response->json('data.positions.0.user_name'))->toBe('Yedek Oyuncu')
        ->and($Response->json('data.positions.0.user_id'))->toBe($Member->public_id)
        ->and($Response->json('data.positions.1.guest_name'))->toBe('Misafir Oyuncu');
});

it('rejects a lineup position referencing a non-member', function () {
    [$Team, $Captain] = createTeamWithCaptain();
    $Outsider = User::factory()->create();

    $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/lineups", [
        'name' => 'Kadro',
        'positions' => [
            ['id' => 'gk', 'x' => 0.5, 'y' => 0.95, 'user_id' => $Outsider->public_id],
        ],
    ])->assertStatus(422)->assertJsonPath('code', 'position_invalid_user');
});

it('rejects a position with both a user and a guest name', function () {
    [$Team, $Captain] = createTeamWithCaptain();

    $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/lineups", [
        'name' => 'Kadro',
        'positions' => [
            ['id' => 'gk', 'x' => 0.5, 'y' => 0.95, 'user_id' => $Captain->public_id, 'guest_name' => 'Karışık'],
        ],
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('validates position coordinates are between 0 and 1', function () {
    [$Team, $Captain] = createTeamWithCaptain();

    $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/lineups", [
        'name' => 'Kadro',
        'positions' => [
            ['id' => 'gk', 'x' => 1.5, 'y' => 0.95],
        ],
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('updates lineup positions', function () {
    [$Team, $Captain] = createTeamWithCaptain();

    $Create = $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/lineups", [
        'name' => 'Kadro',
        'positions' => [['id' => 'gk', 'x' => 0.5, 'y' => 0.95]],
    ])->assertCreated();

    $LineupId = $Create->json('data.id');

    $this->actingAs($Captain)->patchJson("/api/v1/lineups/{$LineupId}", [
        'positions' => [['id' => 'gk', 'x' => 0.4, 'y' => 0.9, 'guest_name' => 'Yeni Oyuncu']],
    ])->assertOk()->assertJsonPath('data.positions.0.guest_name', 'Yeni Oyuncu');
});

it('lists a team lineups', function () {
    [$Team, $Captain] = createTeamWithCaptain();

    $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/lineups", [
        'name' => 'Kadro 1',
        'positions' => [['id' => 'gk', 'x' => 0.5, 'y' => 0.95]],
    ])->assertCreated();

    $this->actingAs($Captain)->getJson("/api/v1/teams/{$Team->public_id}/lineups")
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('forbids non-members from viewing or editing a lineup', function () {
    [$Team, $Captain] = createTeamWithCaptain();
    $Outsider = User::factory()->create();

    $Create = $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/lineups", [
        'name' => 'Kadro',
        'positions' => [['id' => 'gk', 'x' => 0.5, 'y' => 0.95]],
    ])->assertCreated();

    $LineupId = $Create->json('data.id');

    $this->actingAs($Outsider)->getJson("/api/v1/lineups/{$LineupId}")->assertStatus(403);
});
