<?php

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\User;
use App\Notifications\ApplicationDecisionNotification;
use App\Notifications\InviteAcceptedNotification;
use App\Notifications\ListingApplicationNotification;
use App\Notifications\MatchConfirmedNotification;
use App\Notifications\MatchCreatedNotification;
use Illuminate\Support\Facades\Notification;

it('notifies team members except the creator when a match is created', function () {
    Notification::fake();

    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Teammate = User::factory()->create();
    $Team->members()->attach($Teammate->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Captain)->postJson('/api/v1/matches', [
        'team_id' => $Team->public_id,
        'venue_text' => 'Fenerbahçe Halı Saha',
        'starts_at' => now()->addDays(2)->toIso8601String(),
        'format' => 7,
    ])->assertCreated();

    Notification::assertSentTo($Teammate, MatchCreatedNotification::class);
    Notification::assertNotSentTo($Captain, MatchCreatedNotification::class);
});

it('notifies team members when a match is confirmed', function () {
    Notification::fake();

    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create();

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/confirm")->assertOk();

    Notification::assertSentTo($Captain, MatchConfirmedNotification::class);
});

it('notifies the captain when a player applies to a listing', function () {
    Notification::fake();

    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['created_by' => $Captain->id]);
    $Match->forceFill(['status' => 'confirmed'])->save();

    $Listing = $Match->listings()->create([
        'positions_needed' => ['forvet'],
        'needed_count' => 1,
        'level_min' => 1,
        'level_max' => 5,
        'lat' => 41.0,
        'lng' => 29.0,
        'status' => 'open',
        'expires_at' => now()->addDay(),
    ]);

    $Applicant = User::factory()->create();

    $this->actingAs($Applicant)->postJson("/api/v1/listings/{$Listing->public_id}/applications", [])
        ->assertCreated();

    Notification::assertSentTo($Captain, ListingApplicationNotification::class);
});

it('notifies the applicant when their application is decided', function () {
    Notification::fake();

    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['created_by' => $Captain->id]);
    $Match->forceFill(['status' => 'confirmed'])->save();

    $Listing = $Match->listings()->create([
        'positions_needed' => ['forvet'],
        'needed_count' => 1,
        'level_min' => 1,
        'level_max' => 5,
        'lat' => 41.0,
        'lng' => 29.0,
        'status' => 'open',
        'expires_at' => now()->addDay(),
    ]);

    $Applicant = User::factory()->create();
    $Application = $Listing->applications()->create(['user_id' => $Applicant->id]);

    $this->actingAs($Captain)->postJson("/api/v1/applications/{$Application->public_id}/approve")
        ->assertOk();

    Notification::assertSentTo($Applicant, ApplicationDecisionNotification::class);
});

it('notifies the captain when an invite is accepted', function () {
    Notification::fake();

    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $InviteResponse = $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/invites")
        ->assertCreated();
    $Code = $InviteResponse->json('data.code');

    $NewMember = User::factory()->create();
    $this->actingAs($NewMember)->postJson("/api/v1/invites/{$Code}/accept")->assertOk();

    Notification::assertSentTo($Captain, InviteAcceptedNotification::class);
});
