<?php

use App\Models\FootballMatch;
use App\Models\OpponentListing;
use App\Models\Team;
use App\Models\User;

/**
 * @return array{0: Team, 1: User}
 */
function opponentTeamSetup(): array
{
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    return [$Team, $Captain];
}

it('lets a captain create an opponent listing tied to a match', function () {
    [$Team, $Captain] = opponentTeamSetup();
    $Match = FootballMatch::factory()->for($Team)->create();

    $this->actingAs($Captain)->postJson('/api/v1/opponent-listings', [
        'team_id' => $Team->public_id,
        'match_id' => $Match->public_id,
        'note' => 'Perşembe 21:00 rakip arıyoruz.',
    ])->assertCreated()
        ->assertJsonPath('data.status', 'open')
        ->assertJsonPath('data.match.id', $Match->public_id);
});

it('rejects a listing whose match belongs to another team', function () {
    [$Team, $Captain] = opponentTeamSetup();
    [$OtherTeam] = opponentTeamSetup();
    $ForeignMatch = FootballMatch::factory()->for($OtherTeam)->create();

    $this->actingAs($Captain)->postJson('/api/v1/opponent-listings', [
        'team_id' => $Team->public_id,
        'match_id' => $ForeignMatch->public_id,
    ])->assertStatus(422)->assertJsonPath('code', 'match_team_mismatch');
});

it('forbids non-captains from creating an opponent listing', function () {
    [$Team] = opponentTeamSetup();
    $Member = User::factory()->create();
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Member)->postJson('/api/v1/opponent-listings', [
        'team_id' => $Team->public_id,
    ])->assertStatus(403);
});

it('lists open opponent listings', function () {
    [$Team, $Captain] = opponentTeamSetup();
    OpponentListing::create(['team_id' => $Team->id, 'created_by' => $Captain->id]);

    $Searcher = User::factory()->create();

    $this->actingAs($Searcher)->getJson('/api/v1/opponent-listings')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('matches an opponent listing and sets the match opponent', function () {
    [$Team, $Captain] = opponentTeamSetup();
    [$RivalTeam, $RivalCaptain] = opponentTeamSetup();

    $Match = FootballMatch::factory()->for($Team)->create();
    $Listing = OpponentListing::create([
        'team_id' => $Team->id,
        'match_id' => $Match->id,
        'created_by' => $Captain->id,
    ]);

    $this->actingAs($RivalCaptain)->postJson("/api/v1/opponent-listings/{$Listing->public_id}/match", [
        'team_id' => $RivalTeam->public_id,
    ])->assertOk()->assertJsonPath('data.status', 'matched');

    expect($Match->fresh()->opponent_team_id)->toBe($RivalTeam->id);
});

it('prevents matching your own listing', function () {
    [$Team, $Captain] = opponentTeamSetup();
    $Listing = OpponentListing::create(['team_id' => $Team->id, 'created_by' => $Captain->id]);

    $this->actingAs($Captain)->postJson("/api/v1/opponent-listings/{$Listing->public_id}/match", [
        'team_id' => $Team->public_id,
    ])->assertStatus(422)->assertJsonPath('code', 'cannot_match_own_listing');
});

it('prevents matching an already matched listing', function () {
    [$Team, $Captain] = opponentTeamSetup();
    [$RivalTeam, $RivalCaptain] = opponentTeamSetup();

    $Listing = OpponentListing::create([
        'team_id' => $Team->id,
        'status' => 'matched',
        'created_by' => $Captain->id,
    ]);

    $this->actingAs($RivalCaptain)->postJson("/api/v1/opponent-listings/{$Listing->public_id}/match", [
        'team_id' => $RivalTeam->public_id,
    ])->assertStatus(422)->assertJsonPath('code', 'listing_closed');
});
