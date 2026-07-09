<?php

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\User;
use App\Models\Venue;
use App\Models\VenueReview;

/**
 * @return array{0: Venue, 1: FootballMatch, 2: User}
 */
function playedMatchAtVenue(): array
{
    $Venue = Venue::factory()->create();
    $Team = Team::factory()->create();
    $User = User::factory()->create();
    $Team->members()->attach($User->id, ['role' => 'member', 'joined_at' => now()]);

    $Match = FootballMatch::factory()->for($Team)->create([
        'venue_id' => $Venue->id,
        'status' => 'played',
    ]);
    $Match->participants()->create(['user_id' => $User->id, 'source' => 'team']);

    return [$Venue, $Match, $User];
}

it('lets a match participant review the venue', function () {
    [$Venue, $Match, $User] = playedMatchAtVenue();

    $this->actingAs($User)->postJson("/api/v1/venues/{$Venue->public_id}/reviews", [
        'match_id' => $Match->public_id,
        'score' => 5,
        'body' => 'Zemin harika, otopark rahat.',
    ])->assertCreated()
        ->assertJsonPath('data.score', 5)
        ->assertJsonPath('data.body', 'Zemin harika, otopark rahat.')
        ->assertJsonPath('data.author.id', $User->public_id);

    $this->assertDatabaseHas('venue_reviews', [
        'venue_id' => $Venue->id,
        'user_id' => $User->id,
        'match_id' => $Match->id,
        'score' => 5,
    ]);
});

it('rejects a review from a non-participant', function () {
    [$Venue, $Match] = playedMatchAtVenue();
    $Outsider = User::factory()->create();

    $this->actingAs($Outsider)->postJson("/api/v1/venues/{$Venue->public_id}/reviews", [
        'match_id' => $Match->public_id,
        'score' => 4,
    ])->assertStatus(403);
});

it('rejects a review for a match that has not been played yet', function () {
    [$Venue, $Match, $User] = playedMatchAtVenue();
    $Match->forceFill(['status' => 'confirmed'])->save();

    $this->actingAs($User)->postJson("/api/v1/venues/{$Venue->public_id}/reviews", [
        'match_id' => $Match->public_id,
        'score' => 4,
    ])->assertStatus(422)->assertJsonPath('code', 'match_not_played');
});

it('rejects a review when the match belongs to a different venue', function () {
    [, $Match, $User] = playedMatchAtVenue();
    $OtherVenue = Venue::factory()->create();

    $this->actingAs($User)->postJson("/api/v1/venues/{$OtherVenue->public_id}/reviews", [
        'match_id' => $Match->public_id,
        'score' => 4,
    ])->assertStatus(404);
});

it('validates the review score range', function () {
    [$Venue, $Match, $User] = playedMatchAtVenue();

    $this->actingAs($User)->postJson("/api/v1/venues/{$Venue->public_id}/reviews", [
        'match_id' => $Match->public_id,
        'score' => 6,
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('rejects a second review for the same venue even from a different played match', function () {
    [$Venue, $Match, $User] = playedMatchAtVenue();

    $this->actingAs($User)->postJson("/api/v1/venues/{$Venue->public_id}/reviews", [
        'match_id' => $Match->public_id,
        'score' => 4,
    ])->assertCreated();

    $Team = Team::factory()->create();
    $Team->members()->attach($User->id, ['role' => 'member', 'joined_at' => now()]);
    $SecondMatch = FootballMatch::factory()->for($Team)->create([
        'venue_id' => $Venue->id,
        'status' => 'played',
    ]);
    $SecondMatch->participants()->create(['user_id' => $User->id, 'source' => 'team']);

    $this->actingAs($User)->postJson("/api/v1/venues/{$Venue->public_id}/reviews", [
        'match_id' => $SecondMatch->public_id,
        'score' => 2,
    ])->assertStatus(422)->assertJsonPath('code', 'already_reviewed');

    expect(VenueReview::where('venue_id', $Venue->id)->where('user_id', $User->id)->count())->toBe(1);
});
