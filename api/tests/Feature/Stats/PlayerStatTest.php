<?php

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\User;

/**
 * @return array{0: FootballMatch, 1: User, 2: User}
 */
function statMatchSetup(): array
{
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $Player = User::factory()->create();
    $Team->members()->attach($Player->id, ['role' => 'member', 'joined_at' => now()]);

    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subHours(2)]);
    $Match->participants()->create(['user_id' => $Captain->id, 'source' => 'team', 'rsvp' => 'yes']);
    $Match->participants()->create(['user_id' => $Player->id, 'source' => 'team', 'rsvp' => 'yes']);

    return [$Match, $Captain, $Player];
}

it('lists player stats for a match participant', function () {
    [$Match, $Captain, $Player] = statMatchSetup();
    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 1,
        'assists' => 2,
    ])->assertCreated();

    $this->actingAs($Player)->getJson("/api/v1/matches/{$Match->public_id}/player-stats")
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('rejects listing player stats for a non-participant', function () {
    [$Match] = statMatchSetup();
    $Outsider = User::factory()->create();

    $this->actingAs($Outsider)->getJson("/api/v1/matches/{$Match->public_id}/player-stats")
        ->assertStatus(403);
});

it('lets the captain enter a stat for a teammate, auto-approved', function () {
    [$Match, $Captain, $Player] = statMatchSetup();

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 2,
        'assists' => 1,
    ])->assertCreated()
        ->assertJsonPath('data.goals', 2)
        ->assertJsonPath('data.assists', 1)
        ->assertJsonPath('data.approved', true);
});

it('lets a player enter their own stat, pending approval', function () {
    [$Match, , $Player] = statMatchSetup();

    $this->actingAs($Player)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 1,
        'assists' => 0,
    ])->assertCreated()->assertJsonPath('data.approved', false);
});

it('rejects a player entering a stat for someone else', function () {
    [$Match, $Captain, $Player] = statMatchSetup();
    $Other = User::factory()->create();
    $Match->team->members()->attach($Other->id, ['role' => 'member', 'joined_at' => now()]);
    $Match->participants()->create(['user_id' => $Other->id, 'source' => 'team', 'rsvp' => 'yes']);

    $this->actingAs($Other)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 1,
        'assists' => 0,
    ])->assertStatus(403);
});

it('rejects a stat for a non-participant', function () {
    [$Match, $Captain] = statMatchSetup();
    $Outsider = User::factory()->create();

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Outsider->public_id,
        'goals' => 1,
        'assists' => 0,
    ])->assertStatus(422)->assertJsonPath('code', 'not_participant');
});

it('validates goals and assists ranges', function () {
    [$Match, $Captain, $Player] = statMatchSetup();

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => -1,
        'assists' => 0,
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('lets the captain approve a pending self-entered stat', function () {
    [$Match, $Captain, $Player] = statMatchSetup();
    $Stat = $this->actingAs($Player)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 1,
        'assists' => 0,
    ])->assertCreated()->json('data.id');

    $this->actingAs($Captain)->postJson("/api/v1/player-stats/{$Stat}/approve")
        ->assertOk()->assertJsonPath('data.approved', true);
});

it('rejects approval from a non-captain', function () {
    [$Match, , $Player] = statMatchSetup();
    $Stat = $this->actingAs($Player)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 1,
        'assists' => 0,
    ])->assertCreated()->json('data.id');

    $this->actingAs($Player)->postJson("/api/v1/player-stats/{$Stat}/approve")->assertStatus(403);
});

it('rejects approving an already-approved stat', function () {
    [$Match, $Captain, $Player] = statMatchSetup();
    $Stat = $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 1,
        'assists' => 0,
    ])->assertCreated()->json('data.id');

    $this->actingAs($Captain)->postJson("/api/v1/player-stats/{$Stat}/approve")
        ->assertStatus(422)->assertJsonPath('code', 'already_approved');
});
