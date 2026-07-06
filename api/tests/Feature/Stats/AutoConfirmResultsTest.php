<?php

use App\Models\FootballMatch;
use App\Models\MatchResult;
use App\Models\Team;
use App\Models\User;

it('auto-confirms a result pending for more than 48 hours', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subDays(3)]);

    $Result = MatchResult::create([
        'match_id' => $Match->id,
        'home_score' => 2,
        'away_score' => 1,
        'entered_by' => $Captain->id,
        'status' => 'pending',
    ]);
    $Result->forceFill(['created_at' => now()->subHours(50)])->save();

    $this->artisan('results:auto-confirm')->assertSuccessful();

    expect($Result->fresh())
        ->status->toBe('confirmed')
        ->confirmed_by->toBeNull();
});

it('leaves a recently entered pending result untouched', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subHours(3)]);

    $Result = MatchResult::create([
        'match_id' => $Match->id,
        'home_score' => 1,
        'away_score' => 1,
        'entered_by' => $Captain->id,
        'status' => 'pending',
    ]);

    $this->artisan('results:auto-confirm')->assertSuccessful();

    expect($Result->fresh()->status)->toBe('pending');
});

it('does not touch an already-disputed result', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subDays(3)]);

    $Result = MatchResult::create([
        'match_id' => $Match->id,
        'home_score' => 1,
        'away_score' => 1,
        'entered_by' => $Captain->id,
        'status' => 'disputed',
    ]);
    $Result->forceFill(['created_at' => now()->subHours(50)])->save();

    $this->artisan('results:auto-confirm')->assertSuccessful();

    expect($Result->fresh()->status)->toBe('disputed');
});
