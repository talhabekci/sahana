<?php

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * @return array{0: FootballMatch, 1: User, 2: User}
 */
function ratingMatchSetup(?Carbon $StartsAt = null): array
{
    $Rater = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Rater->id, ['role' => 'captain', 'joined_at' => now()]);

    $Ratee = User::factory()->create();
    $Team->members()->attach($Ratee->id, ['role' => 'member', 'joined_at' => now()]);

    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => $StartsAt ?? now()->subHours(2)]);
    $Match->participants()->create(['user_id' => $Rater->id, 'source' => 'team', 'rsvp' => 'yes']);
    $Match->participants()->create(['user_id' => $Ratee->id, 'source' => 'team', 'rsvp' => 'yes']);

    return [$Match, $Rater, $Ratee];
}

it('lets a participant rate a teammate within the 48h window', function () {
    [$Match, $Rater, $Ratee] = ratingMatchSetup();

    $this->actingAs($Rater)->postJson("/api/v1/matches/{$Match->public_id}/ratings", [
        'ratee_id' => $Ratee->public_id,
        'score' => 8,
    ])->assertOk()->assertJsonPath('data.status', 'rated');

    $this->assertDatabaseHas('player_ratings', [
        'match_id' => $Match->id,
        'rater_id' => $Rater->id,
        'ratee_id' => $Ratee->id,
        'score' => 8,
    ]);
});

it('updates an existing rating within the window instead of duplicating', function () {
    [$Match, $Rater, $Ratee] = ratingMatchSetup();

    $this->actingAs($Rater)->postJson("/api/v1/matches/{$Match->public_id}/ratings", [
        'ratee_id' => $Ratee->public_id,
        'score' => 5,
    ])->assertOk();
    $this->actingAs($Rater)->postJson("/api/v1/matches/{$Match->public_id}/ratings", [
        'ratee_id' => $Ratee->public_id,
        'score' => 9,
    ])->assertOk();

    $this->assertDatabaseCount('player_ratings', 1);
    $this->assertDatabaseHas('player_ratings', ['score' => 9]);
});

it('rejects rating outside the 48h window', function () {
    [$Match, $Rater, $Ratee] = ratingMatchSetup(now()->subHours(50));

    $this->actingAs($Rater)->postJson("/api/v1/matches/{$Match->public_id}/ratings", [
        'ratee_id' => $Ratee->public_id,
        'score' => 7,
    ])->assertStatus(422)->assertJsonPath('code', 'rating_window_closed');
});

it('rejects rating before the match has started', function () {
    [$Match, $Rater, $Ratee] = ratingMatchSetup(now()->addHour());

    $this->actingAs($Rater)->postJson("/api/v1/matches/{$Match->public_id}/ratings", [
        'ratee_id' => $Ratee->public_id,
        'score' => 7,
    ])->assertStatus(422)->assertJsonPath('code', 'rating_window_closed');
});

it('rejects self-rating', function () {
    [$Match, $Rater] = ratingMatchSetup();

    $this->actingAs($Rater)->postJson("/api/v1/matches/{$Match->public_id}/ratings", [
        'ratee_id' => $Rater->public_id,
        'score' => 7,
    ])->assertStatus(422)->assertJsonPath('code', 'cannot_rate_self');
});

it('rejects rating a non-participant', function () {
    [$Match, $Rater] = ratingMatchSetup();
    $Outsider = User::factory()->create();

    $this->actingAs($Rater)->postJson("/api/v1/matches/{$Match->public_id}/ratings", [
        'ratee_id' => $Outsider->public_id,
        'score' => 7,
    ])->assertStatus(422)->assertJsonPath('code', 'not_participant');
});

it('rejects rating on a cancelled match', function () {
    [$Match, $Rater, $Ratee] = ratingMatchSetup();
    $Match->forceFill(['status' => 'cancelled'])->save();

    $this->actingAs($Rater)->postJson("/api/v1/matches/{$Match->public_id}/ratings", [
        'ratee_id' => $Ratee->public_id,
        'score' => 7,
    ])->assertStatus(422)->assertJsonPath('code', 'match_cancelled');
});

it('validates score is between 1 and 10', function () {
    [$Match, $Rater, $Ratee] = ratingMatchSetup();

    $this->actingAs($Rater)->postJson("/api/v1/matches/{$Match->public_id}/ratings", [
        'ratee_id' => $Ratee->public_id,
        'score' => 11,
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});
