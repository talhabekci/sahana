<?php

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\User;

function matchWithParticipant(): array
{
    $Player = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Player->id, ['role' => 'captain', 'joined_at' => now()]);

    $Match = FootballMatch::factory()->for($Team)->create();
    $Match->participants()->create(['user_id' => $Player->id, 'source' => 'team']);

    return [$Match, $Player];
}

it('lets a participant rsvp and is idempotent', function () {
    [$Match, $Player] = matchWithParticipant();

    $this->actingAs($Player)->putJson("/api/v1/matches/{$Match->public_id}/rsvp", ['status' => 'yes'])
        ->assertOk()
        ->assertJsonPath('data.my_rsvp', 'yes')
        ->assertJsonPath('data.rsvp_summary.yes', 1);

    // Aynı isteği tekrarlamak durumu bozmaz (api-conventions §6)
    $this->actingAs($Player)->putJson("/api/v1/matches/{$Match->public_id}/rsvp", ['status' => 'yes'])
        ->assertOk()
        ->assertJsonPath('data.rsvp_summary.yes', 1);
});

it('lets a participant change their rsvp', function () {
    [$Match, $Player] = matchWithParticipant();

    $this->actingAs($Player)->putJson("/api/v1/matches/{$Match->public_id}/rsvp", ['status' => 'yes'])->assertOk();

    $this->actingAs($Player)->putJson("/api/v1/matches/{$Match->public_id}/rsvp", ['status' => 'maybe'])
        ->assertOk()
        ->assertJsonPath('data.my_rsvp', 'maybe')
        ->assertJsonPath('data.rsvp_summary.yes', 0)
        ->assertJsonPath('data.rsvp_summary.maybe', 1);
});

it('rejects rsvp from a non-participant', function () {
    [$Match] = matchWithParticipant();
    $Outsider = User::factory()->create();

    $this->actingAs($Outsider)->putJson("/api/v1/matches/{$Match->public_id}/rsvp", ['status' => 'yes'])
        ->assertStatus(403)
        ->assertJsonPath('code', 'not_participant');
});

it('rejects rsvp on a cancelled match', function () {
    [$Match, $Player] = matchWithParticipant();
    $Match->forceFill(['status' => 'cancelled'])->save();

    $this->actingAs($Player)->putJson("/api/v1/matches/{$Match->public_id}/rsvp", ['status' => 'yes'])
        ->assertStatus(422)
        ->assertJsonPath('code', 'match_closed');
});

it('validates the rsvp value', function () {
    [$Match, $Player] = matchWithParticipant();

    $this->actingAs($Player)->putJson("/api/v1/matches/{$Match->public_id}/rsvp", ['status' => 'belki'])
        ->assertStatus(422)
        ->assertJsonPath('code', 'validation_failed');
});
