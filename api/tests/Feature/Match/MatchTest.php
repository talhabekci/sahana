<?php

use App\Models\District;
use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\User;
use App\Models\Venue;

function teamWithCaptain(): array
{
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    return [$Team, $Captain];
}

it('creates a match and seeds team members as participants', function () {
    [$Team, $Captain] = teamWithCaptain();
    $Member = User::factory()->create();
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $Response = $this->actingAs($Captain)->postJson('/api/v1/matches', [
        'team_id' => $Team->public_id,
        'venue_text' => 'Yıldız Halı Saha',
        'starts_at' => now()->addDays(3)->toIso8601String(),
        'format' => 7,
        'price_per_player' => 150,
    ])->assertCreated()
        ->assertJsonPath('data.status', 'draft')
        ->assertJsonPath('data.rsvp_summary.pending', 2);

    expect($Response->json('data.participants'))->toHaveCount(2);
});

it('forbids a non-captain from creating a match', function () {
    [$Team] = teamWithCaptain();
    $Member = User::factory()->create();
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Member)->postJson('/api/v1/matches', [
        'team_id' => $Team->public_id,
        'venue_text' => 'Saha',
        'starts_at' => now()->addDay()->toIso8601String(),
        'format' => 7,
    ])->assertStatus(403);
});

it('validates match creation fields', function () {
    [$Team, $Captain] = teamWithCaptain();

    $this->actingAs($Captain)->postJson('/api/v1/matches', [
        'team_id' => $Team->public_id,
        'venue_text' => '',
        'starts_at' => now()->subDay()->toIso8601String(),
        'format' => 12,
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('lists upcoming and past matches separately', function () {
    [$Team, $Captain] = teamWithCaptain();

    $Upcoming = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->addDays(2)]);
    $Past = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subDays(2)]);

    foreach ([$Upcoming, $Past] as $Match) {
        $Match->participants()->create(['user_id' => $Captain->id, 'source' => 'team']);
    }

    $UpcomingResponse = $this->actingAs($Captain)->getJson('/api/v1/matches?filter=upcoming')->assertOk();
    expect($UpcomingResponse->json('data.0.id'))->toBe($Upcoming->public_id)
        ->and($UpcomingResponse->json('data'))->toHaveCount(1);

    $PastResponse = $this->actingAs($Captain)->getJson('/api/v1/matches?filter=past')->assertOk();
    expect($PastResponse->json('data.0.id'))->toBe($Past->public_id);
});

it('confirms then cancels a match through valid transitions', function () {
    [$Team, $Captain] = teamWithCaptain();
    $Match = FootballMatch::factory()->for($Team)->create();
    $Match->participants()->create(['user_id' => $Captain->id, 'source' => 'team']);

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/confirm")
        ->assertOk()->assertJsonPath('data.status', 'confirmed');

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/confirm")
        ->assertStatus(422)->assertJsonPath('code', 'invalid_status_transition');

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/cancel")
        ->assertOk()->assertJsonPath('data.status', 'cancelled');
});

it('hides match detail from outsiders', function () {
    [$Team] = teamWithCaptain();
    $Match = FootballMatch::factory()->for($Team)->create();
    $Outsider = User::factory()->create();

    $this->actingAs($Outsider)->getJson("/api/v1/matches/{$Match->public_id}")
        ->assertStatus(403);
});

it('marks past confirmed matches as played via sweep', function () {
    [$Team] = teamWithCaptain();
    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subHour()]);
    $Match->forceFill(['status' => 'confirmed'])->save();

    $this->artisan('matches:sweep')->assertSuccessful();

    expect($Match->fresh()->status)->toBe('played');
});

it('creates a match with a venue picked from the directory', function () {
    [$Team, $Captain] = teamWithCaptain();
    $Venue = Venue::factory()->create(['name' => 'Kadıköy Halı Saha']);

    $Response = $this->actingAs($Captain)->postJson('/api/v1/matches', [
        'team_id' => $Team->public_id,
        'venue_id' => $Venue->public_id,
        'venue_text' => 'Kadıköy Halı Saha',
        'starts_at' => now()->addDays(3)->toIso8601String(),
        'format' => 7,
    ])->assertCreated();

    $Response->assertJsonPath('data.venue.id', $Venue->public_id)
        ->assertJsonPath('data.venue.name', 'Kadıköy Halı Saha');

    $this->assertDatabaseHas('matches', ['venue_id' => $Venue->id]);
});

it('creates a match with an optional sosyalhalisaha venue match', function () {
    [$Team, $Captain] = teamWithCaptain();
    $District = District::where('city_id', 34)->where('name', 'Kadıköy')->firstOrFail();
    $District->forceFill(['external_id' => 415])->save();
    $SosyalhalisahaVenue = Venue::factory()
        ->sosyalhalisaha($District->id, 1616)
        ->create(['name' => 'Çekmeköy Belediye Spor Kulubü Halı Saha']);

    $Response = $this->actingAs($Captain)->postJson('/api/v1/matches', [
        'team_id' => $Team->public_id,
        'sosyalhalisaha_venue_id' => $SosyalhalisahaVenue->id,
        'venue_text' => 'Çekmeköy Belediye Spor Kulubü Halı Saha',
        'starts_at' => now()->addDays(3)->toIso8601String(),
        'format' => 7,
    ])->assertCreated();

    $this->assertDatabaseHas('matches', [
        'public_id' => $Response->json('data.id'),
        'sosyalhalisaha_venue_id' => $SosyalhalisahaVenue->id,
    ]);
});

it('exposes video_search_url only when the match is played and a venue is matched', function () {
    [$Team, $Captain] = teamWithCaptain();
    $District = District::where('city_id', 34)->where('name', 'Kadıköy')->firstOrFail();
    $District->forceFill(['external_id' => 415])->save();
    $SosyalhalisahaVenue = Venue::factory()
        ->sosyalhalisaha($District->id, 1616)
        ->create(['name' => 'Test Saha']);

    // UTC 20:00 -> Europe/Istanbul (+3) 23:00.
    $Match = FootballMatch::factory()->for($Team)->create([
        'sosyalhalisaha_venue_id' => $SosyalhalisahaVenue->id,
        'starts_at' => '2026-06-30 20:00:00',
    ]);
    $Match->participants()->create(['user_id' => $Captain->id, 'source' => 'team']);

    $NotPlayedResponse = $this->actingAs($Captain)->getJson("/api/v1/matches/{$Match->public_id}")->assertOk();
    expect($NotPlayedResponse->json('data.video_search_url'))->toBeNull();

    $Match->forceFill(['status' => 'played'])->save();

    $PlayedResponse = $this->actingAs($Captain)->getJson("/api/v1/matches/{$Match->public_id}")->assertOk();
    expect($PlayedResponse->json('data.video_search_url'))
        ->toBe('https://sosyalhalisaha.com/xhr/filtre/34_415_1616_2026-06-30_23:00_');
});
