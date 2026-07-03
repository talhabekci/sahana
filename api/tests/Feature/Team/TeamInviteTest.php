<?php

use App\Models\Team;
use App\Models\TeamInvite;
use App\Models\User;

it('lets the captain generate an invite code', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $Response = $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/invites")
        ->assertCreated();

    expect($Response->json('data.code'))->toBeString()->toHaveLength(8);
});

it('forbids a member from generating an invite', function () {
    $Captain = User::factory()->create();
    $Member = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Member)->postJson("/api/v1/teams/{$Team->public_id}/invites")
        ->assertStatus(403);
});

it('joins a team via a valid invite code', function () {
    $Team = Team::factory()->create();
    $Joiner = User::factory()->create();
    $Invite = TeamInvite::factory()->for($Team)->create(['code' => 'ABCD1234']);

    $this->actingAs($Joiner)->postJson('/api/v1/invites/ABCD1234/accept')
        ->assertOk()
        ->assertJsonPath('data.members_count', 1);

    $this->assertDatabaseHas('team_members', ['team_id' => $Team->id, 'user_id' => $Joiner->id, 'role' => 'member']);
    expect($Invite->fresh()->uses_count)->toBe(1);
});

it('is idempotent when an existing member accepts again', function () {
    $Team = Team::factory()->create();
    $Member = User::factory()->create();
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);
    $Invite = TeamInvite::factory()->for($Team)->create(['code' => 'REPEAT01']);

    $this->actingAs($Member)->postJson('/api/v1/invites/REPEAT01/accept')->assertOk();

    expect($Invite->fresh()->uses_count)->toBe(0);
});

it('rejects an unknown invite code', function () {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/v1/invites/NOPENOPE/accept')
        ->assertStatus(404)
        ->assertJsonPath('code', 'invite_not_found');
});

it('rejects an expired invite', function () {
    $Team = Team::factory()->create();
    TeamInvite::factory()->for($Team)->create(['code' => 'EXPIRED1', 'expires_at' => now()->subMinute()]);

    $this->actingAs(User::factory()->create())
        ->postJson('/api/v1/invites/EXPIRED1/accept')
        ->assertStatus(422)
        ->assertJsonPath('code', 'invite_expired');
});

it('rejects an exhausted invite', function () {
    $Team = Team::factory()->create();
    TeamInvite::factory()->for($Team)->create(['code' => 'MAXEDOUT', 'max_uses' => 1, 'uses_count' => 1]);

    $this->actingAs(User::factory()->create())
        ->postJson('/api/v1/invites/MAXEDOUT/accept')
        ->assertStatus(422)
        ->assertJsonPath('code', 'invite_exhausted');
});
