<?php

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\User;

/**
 * @return array{0: FootballMatch, 1: User, 2: User, 3: Team, 4: Team}
 */
function resultMatchSetup(): array
{
    $HomeCaptain = User::factory()->create();
    $HomeTeam = Team::factory()->create();
    $HomeTeam->members()->attach($HomeCaptain->id, ['role' => 'captain', 'joined_at' => now()]);

    $OpponentCaptain = User::factory()->create();
    $OpponentTeam = Team::factory()->create();
    $OpponentTeam->members()->attach($OpponentCaptain->id, ['role' => 'captain', 'joined_at' => now()]);

    $Match = FootballMatch::factory()->for($HomeTeam)->create([
        'opponent_team_id' => $OpponentTeam->id,
        'starts_at' => now()->subHours(3),
    ]);
    $Match->forceFill(['status' => 'played'])->save();
    $Match->participants()->create(['user_id' => $HomeCaptain->id, 'source' => 'team', 'rsvp' => 'yes']);

    return [$Match, $HomeCaptain, $OpponentCaptain, $HomeTeam, $OpponentTeam];
}

it('lets the home captain enter a match result', function () {
    [$Match, $HomeCaptain] = resultMatchSetup();

    $this->actingAs($HomeCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
        'home_score' => 3,
        'away_score' => 1,
    ])->assertCreated()
        ->assertJsonPath('data.result.status', 'pending')
        ->assertJsonPath('data.result.home_score', 3)
        ->assertJsonPath('data.result.away_score', 1);
});

it('marks rsvp=yes participants as no-show when listed', function () {
    [$Match, $HomeCaptain] = resultMatchSetup();
    $Teammate = User::factory()->create();
    $Match->team->members()->attach($Teammate->id, ['role' => 'member', 'joined_at' => now()]);
    $Match->participants()->create(['user_id' => $Teammate->id, 'source' => 'team', 'rsvp' => 'yes']);

    $this->actingAs($HomeCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
        'home_score' => 2,
        'away_score' => 2,
        'no_show_user_ids' => [$Teammate->public_id],
    ])->assertCreated();

    $this->assertDatabaseHas('match_participants', [
        'match_id' => $Match->id,
        'user_id' => $Teammate->id,
        'attended' => false,
    ]);
    $this->assertDatabaseHas('match_participants', [
        'match_id' => $Match->id,
        'user_id' => $HomeCaptain->id,
        'attended' => true,
    ]);
});

it('rejects entering a result when there is no registered opponent team', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subHours(3)]);

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
        'home_score' => 1,
        'away_score' => 0,
    ])->assertStatus(422)->assertJsonPath('code', 'no_opponent_team');
});

it('rejects entering a result before the match has started', function () {
    [$Match, $HomeCaptain] = resultMatchSetup();
    $Match->forceFill(['starts_at' => now()->addDay()])->save();

    $this->actingAs($HomeCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
        'home_score' => 1,
        'away_score' => 0,
    ])->assertStatus(422)->assertJsonPath('code', 'match_not_played_yet');
});

it('rejects entering a result from a non-captain', function () {
    [$Match, , $OpponentCaptain] = resultMatchSetup();

    $this->actingAs($OpponentCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
        'home_score' => 1,
        'away_score' => 0,
    ])->assertStatus(403);
});

it('rejects entering a duplicate result', function () {
    [$Match, $HomeCaptain] = resultMatchSetup();

    $this->actingAs($HomeCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
        'home_score' => 1,
        'away_score' => 0,
    ])->assertCreated();

    $this->actingAs($HomeCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
        'home_score' => 2,
        'away_score' => 0,
    ])->assertStatus(422)->assertJsonPath('code', 'result_already_exists');
});

it('validates score fields', function () {
    [$Match, $HomeCaptain] = resultMatchSetup();

    $this->actingAs($HomeCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
        'home_score' => -1,
        'away_score' => 0,
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('lets the opponent captain confirm a pending result', function () {
    [$Match, $HomeCaptain, $OpponentCaptain] = resultMatchSetup();
    $this->actingAs($HomeCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
        'home_score' => 1,
        'away_score' => 1,
    ])->assertCreated();

    $this->actingAs($OpponentCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result/confirm")
        ->assertOk()
        ->assertJsonPath('data.result.status', 'confirmed');
});

it('rejects confirming a result by the home captain', function () {
    [$Match, $HomeCaptain] = resultMatchSetup();
    $this->actingAs($HomeCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
        'home_score' => 1,
        'away_score' => 1,
    ])->assertCreated();

    $this->actingAs($HomeCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result/confirm")
        ->assertStatus(403);
});

it('lets the opponent captain dispute a pending result', function () {
    [$Match, $HomeCaptain, $OpponentCaptain] = resultMatchSetup();
    $this->actingAs($HomeCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
        'home_score' => 5,
        'away_score' => 0,
    ])->assertCreated();

    $this->actingAs($OpponentCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result/dispute")
        ->assertOk()
        ->assertJsonPath('data.result.status', 'disputed');
});

it('rejects confirming an already-confirmed result', function () {
    [$Match, $HomeCaptain, $OpponentCaptain] = resultMatchSetup();
    $this->actingAs($HomeCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
        'home_score' => 1,
        'away_score' => 0,
    ])->assertCreated();
    $this->actingAs($OpponentCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result/confirm")->assertOk();

    $this->actingAs($OpponentCaptain)->postJson("/api/v1/matches/{$Match->public_id}/result/confirm")
        ->assertStatus(422)->assertJsonPath('code', 'no_pending_result');
});
