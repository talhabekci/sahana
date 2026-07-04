<?php

use App\Models\FootballMatch;
use App\Models\PlayerListing;
use App\Models\Team;
use App\Models\User;

/**
 * @return array{0: PlayerListing, 1: User, 2: FootballMatch}
 */
function openListing(array $ListingAttributes = []): array
{
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $Match = FootballMatch::factory()->for($Team)->create();
    $Match->participants()->create(['user_id' => $Captain->id, 'source' => 'team']);

    $Listing = PlayerListing::factory()->for($Match, 'match')->create($ListingAttributes);

    return [$Listing, $Captain, $Match];
}

it('lets the captain create a listing for a match', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create();

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/listings", [
        'positions_needed' => ['defans', 'kaleci'],
        'needed_count' => 2,
        'level_min' => 2,
        'level_max' => 4,
        'lat' => 41.0082,
        'lng' => 28.9784,
    ])->assertCreated()
        ->assertJsonPath('data.status', 'open')
        ->assertJsonPath('data.needed_count', 2);
});

it('forbids non-captains from creating a listing', function () {
    [, , $Match] = openListing();
    $Outsider = User::factory()->create();

    $this->actingAs($Outsider)->postJson("/api/v1/matches/{$Match->public_id}/listings", [
        'positions_needed' => ['defans'],
        'needed_count' => 1,
        'level_min' => 1,
        'level_max' => 5,
        'lat' => 41.0,
        'lng' => 29.0,
    ])->assertStatus(403);
});

it('discovers listings within the radius and sorts by distance', function () {
    // Kadıköy merkezli iki ilan: ~1 km ve ~5 km; Ankara'daki ilan elenmeli.
    [$Near] = openListing(['lat' => 40.9900, 'lng' => 29.0250]);
    [$Farther] = openListing(['lat' => 41.0300, 'lng' => 29.0100]);
    openListing(['lat' => 39.9334, 'lng' => 32.8597]); // Ankara

    $Searcher = User::factory()->create();

    $Response = $this->actingAs($Searcher)
        ->getJson('/api/v1/listings?near=40.9903,29.0290&radius=10')
        ->assertOk();

    expect($Response->json('data'))->toHaveCount(2)
        ->and($Response->json('data.0.id'))->toBe($Near->public_id)
        ->and($Response->json('data.1.id'))->toBe($Farther->public_id)
        ->and($Response->json('data.0.distance_km'))->toBeLessThan($Response->json('data.1.distance_km'));
});

it('filters listings by position', function () {
    openListing(['positions_needed' => ['kaleci']]);
    [$DefansListing] = openListing(['positions_needed' => ['defans']]);

    $Searcher = User::factory()->create();

    $Response = $this->actingAs($Searcher)->getJson('/api/v1/listings?position=defans')->assertOk();

    expect($Response->json('data'))->toHaveCount(1)
        ->and($Response->json('data.0.id'))->toBe($DefansListing->public_id);
});

it('lets a player apply and blocks duplicate applications', function () {
    [$Listing] = openListing();
    $Player = User::factory()->create();

    $this->actingAs($Player)->postJson("/api/v1/listings/{$Listing->public_id}/applications", [
        'note' => 'Sağ bek oynarım.',
    ])->assertCreated()->assertJsonPath('data.status', 'pending');

    $this->actingAs($Player)->postJson("/api/v1/listings/{$Listing->public_id}/applications")
        ->assertStatus(422)->assertJsonPath('code', 'already_applied');
});

it('approves an application, adds participant and fills the listing', function () {
    [$Listing, $Captain, $Match] = openListing(['needed_count' => 1]);
    $Player = User::factory()->create();

    $Apply = $this->actingAs($Player)
        ->postJson("/api/v1/listings/{$Listing->public_id}/applications")
        ->assertCreated();

    $ApplicationId = $Apply->json('data.id');

    $this->actingAs($Captain)->postJson("/api/v1/applications/{$ApplicationId}/approve")
        ->assertOk()->assertJsonPath('data.status', 'approved');

    $this->assertDatabaseHas('match_participants', [
        'match_id' => $Match->id,
        'user_id' => $Player->id,
        'source' => 'listing',
        'rsvp' => 'yes',
    ]);

    expect($Listing->fresh()->status)->toBe('filled');
});

it('rejects an application without adding a participant', function () {
    [$Listing, $Captain, $Match] = openListing();
    $Player = User::factory()->create();

    $ApplicationId = $this->actingAs($Player)
        ->postJson("/api/v1/listings/{$Listing->public_id}/applications")
        ->json('data.id');

    $this->actingAs($Captain)->postJson("/api/v1/applications/{$ApplicationId}/reject")
        ->assertOk()->assertJsonPath('data.status', 'rejected');

    $this->assertDatabaseMissing('match_participants', [
        'match_id' => $Match->id,
        'user_id' => $Player->id,
    ]);
});

it('forbids non-captains from deciding applications', function () {
    [$Listing] = openListing();
    $Player = User::factory()->create();
    $Stranger = User::factory()->create();

    $ApplicationId = $this->actingAs($Player)
        ->postJson("/api/v1/listings/{$Listing->public_id}/applications")
        ->json('data.id');

    $this->actingAs($Stranger)->postJson("/api/v1/applications/{$ApplicationId}/approve")
        ->assertStatus(403);
});

it('rejects applications to a filled listing', function () {
    [$Listing] = openListing(['status' => 'filled']);
    $Player = User::factory()->create();

    $this->actingAs($Player)->postJson("/api/v1/listings/{$Listing->public_id}/applications")
        ->assertStatus(422)->assertJsonPath('code', 'listing_already_filled');
});

it('expires open listings past their expiry via sweep', function () {
    [$Listing] = openListing(['expires_at' => now()->subHour()]);

    $this->artisan('matches:sweep')->assertSuccessful();

    expect($Listing->fresh()->status)->toBe('expired');
});
