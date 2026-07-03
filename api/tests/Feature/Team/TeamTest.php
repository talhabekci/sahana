<?php

use App\Models\Team;
use App\Models\User;

it('creates a team and makes the creator captain', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/teams', [
        'name' => 'Kartallar FK',
        'badge_icon' => 'shield',
        'color_home' => '#1A4029',
    ])->assertCreated()
        ->assertJsonPath('data.name', 'Kartallar FK')
        ->assertJsonPath('data.my_role', 'captain')
        ->assertJsonPath('data.members_count', 1);
});

it('validates team creation fields', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/teams', [
        'name' => '',
        'badge_icon' => 'not-a-real-icon',
        'color_home' => 'red',
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('lists only the teams the user belongs to', function () {
    $User = User::factory()->create();
    $Other = User::factory()->create();

    $MyTeam = Team::factory()->create();
    $MyTeam->members()->attach($User->id, ['role' => 'captain', 'joined_at' => now()]);

    $OtherTeam = Team::factory()->create();
    $OtherTeam->members()->attach($Other->id, ['role' => 'captain', 'joined_at' => now()]);

    $Response = $this->actingAs($User)->getJson('/api/v1/teams')->assertOk();

    expect($Response->json('data'))->toHaveCount(1)
        ->and($Response->json('data.0.id'))->toBe($MyTeam->public_id);
});

it('shows team detail with members for a member', function () {
    $User = User::factory()->create(['name' => 'Kaptan Ali']);
    $Team = Team::factory()->create();
    $Team->members()->attach($User->id, ['role' => 'captain', 'joined_at' => now()]);

    $this->actingAs($User)->getJson('/api/v1/teams/'.$Team->public_id)
        ->assertOk()
        ->assertJsonPath('data.members.0.name', 'Kaptan Ali')
        ->assertJsonPath('data.members.0.role', 'captain');
});

it('forbids non-members from viewing team detail', function () {
    $Outsider = User::factory()->create();
    $Team = Team::factory()->create();

    $this->actingAs($Outsider)->getJson('/api/v1/teams/'.$Team->public_id)
        ->assertStatus(403)
        ->assertJsonPath('code', 'forbidden');
});

it('lets the captain update team info', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create(['name' => 'Eski İsim']);
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $this->actingAs($Captain)->patchJson('/api/v1/teams/'.$Team->public_id, [
        'name' => 'Yeni İsim',
    ])->assertOk()->assertJsonPath('data.name', 'Yeni İsim');
});

it('forbids a regular member from updating team info', function () {
    $Captain = User::factory()->create();
    $Member = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Member)->patchJson('/api/v1/teams/'.$Team->public_id, [
        'name' => 'Değiştirmeye Çalışıyorum',
    ])->assertStatus(403);
});
