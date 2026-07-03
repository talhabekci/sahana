<?php

use App\Models\Team;
use App\Models\User;

it('lets a member leave the team themselves', function () {
    $Captain = User::factory()->create();
    $Member = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Member)
        ->deleteJson("/api/v1/teams/{$Team->public_id}/members/{$Member->public_id}")
        ->assertOk();

    $this->assertDatabaseMissing('team_members', ['team_id' => $Team->id, 'user_id' => $Member->id]);
});

it('lets the captain remove another member', function () {
    $Captain = User::factory()->create();
    $Member = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Captain)
        ->deleteJson("/api/v1/teams/{$Team->public_id}/members/{$Member->public_id}")
        ->assertOk();

    $this->assertDatabaseMissing('team_members', ['team_id' => $Team->id, 'user_id' => $Member->id]);
});

it('forbids a member from removing another member', function () {
    $Captain = User::factory()->create();
    $MemberA = User::factory()->create();
    $MemberB = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Team->members()->attach($MemberA->id, ['role' => 'member', 'joined_at' => now()]);
    $Team->members()->attach($MemberB->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($MemberA)
        ->deleteJson("/api/v1/teams/{$Team->public_id}/members/{$MemberB->public_id}")
        ->assertStatus(403);
});

it('prevents the captain from leaving without transferring captaincy first', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $this->actingAs($Captain)
        ->deleteJson("/api/v1/teams/{$Team->public_id}/members/{$Captain->public_id}")
        ->assertStatus(422)
        ->assertJsonPath('code', 'captain_must_transfer_first');
});

it('transfers captaincy to another member', function () {
    $Captain = User::factory()->create();
    $Member = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Captain)
        ->postJson("/api/v1/teams/{$Team->public_id}/transfer-captaincy", ['user_id' => $Member->public_id])
        ->assertOk();

    $this->assertDatabaseHas('team_members', ['team_id' => $Team->id, 'user_id' => $Member->id, 'role' => 'captain']);
    $this->assertDatabaseHas('team_members', ['team_id' => $Team->id, 'user_id' => $Captain->id, 'role' => 'member']);
});

it('forbids a non-captain from transferring captaincy', function () {
    $Captain = User::factory()->create();
    $Member = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Member)
        ->postJson("/api/v1/teams/{$Team->public_id}/transfer-captaincy", ['user_id' => $Captain->public_id])
        ->assertStatus(403);
});

it('rejects transferring captaincy to a non-member', function () {
    $Captain = User::factory()->create();
    $Outsider = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $this->actingAs($Captain)
        ->postJson("/api/v1/teams/{$Team->public_id}/transfer-captaincy", ['user_id' => $Outsider->public_id])
        ->assertStatus(422)
        ->assertJsonPath('code', 'not_team_member');
});
