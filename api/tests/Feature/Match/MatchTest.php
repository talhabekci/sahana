<?php

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\User;

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
