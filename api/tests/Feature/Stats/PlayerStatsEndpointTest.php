<?php

use App\Models\FootballMatch;
use App\Models\PlayerMatchStat;
use App\Models\PlayerRating;
use App\Models\Team;
use App\Models\User;

it('returns season totals for matches/goals/assists', function () {
    $Viewer = User::factory()->create();
    $Player = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Player->id, ['role' => 'member', 'joined_at' => now()]);

    $MatchThisYear = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subDays(3)]);
    $MatchThisYear->participants()->create(['user_id' => $Player->id, 'source' => 'team', 'rsvp' => 'yes']);
    PlayerMatchStat::create([
        'match_id' => $MatchThisYear->id,
        'user_id' => $Player->id,
        'goals' => 2,
        'assists' => 1,
        'approved' => true,
        'entered_by' => $Player->id,
    ]);

    // Onaylanmamış istatistik toplama girmemeli (ayrı bir maçta, unique(match_id,user_id) gereği).
    $UnapprovedMatch = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subDays(4)]);
    $UnapprovedMatch->participants()->create(['user_id' => $Player->id, 'source' => 'team', 'rsvp' => 'yes']);
    PlayerMatchStat::create([
        'match_id' => $UnapprovedMatch->id,
        'user_id' => $Player->id,
        'goals' => 99,
        'assists' => 99,
        'approved' => false,
        'entered_by' => $Player->id,
    ]);

    $Response = $this->actingAs($Viewer)
        ->getJson("/api/v1/players/{$Player->public_id}/stats?season=".now()->year)
        ->assertOk();

    $Response->assertJsonPath('data.matches', 2)
        ->assertJsonPath('data.goals', 2)
        ->assertJsonPath('data.assists', 1);
});

it('hides the rating average until at least 3 ratings are received', function () {
    $Viewer = User::factory()->create();
    $Player = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Player->id, ['role' => 'member', 'joined_at' => now()]);

    for ($i = 0; $i < 2; $i++) {
        $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subDays($i + 1)]);
        PlayerRating::create([
            'match_id' => $Match->id,
            'rater_id' => User::factory()->create()->id,
            'ratee_id' => $Player->id,
            'score' => 8,
        ]);
    }

    $this->actingAs($Viewer)->getJson("/api/v1/players/{$Player->public_id}/stats")
        ->assertOk()
        ->assertJsonPath('data.rating', null)
        ->assertJsonPath('data.ratings_count', 2);
});

it('shows a time-weighted rating average once 3+ ratings exist', function () {
    $Viewer = User::factory()->create();
    $Player = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Player->id, ['role' => 'member', 'joined_at' => now()]);

    foreach ([8, 9, 7] as $Index => $Score) {
        $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subDays($Index + 1)]);
        PlayerRating::create([
            'match_id' => $Match->id,
            'rater_id' => User::factory()->create()->id,
            'ratee_id' => $Player->id,
            'score' => $Score,
        ]);
    }

    $Response = $this->actingAs($Viewer)->getJson("/api/v1/players/{$Player->public_id}/stats")
        ->assertOk()
        ->assertJsonPath('data.ratings_count', 3);

    expect($Response->json('data.rating'))->toBeGreaterThan(7.0)->toBeLessThan(9.0);
});

it('computes reliability from attended vs no-show counts', function () {
    $Viewer = User::factory()->create();
    $Player = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Player->id, ['role' => 'member', 'joined_at' => now()]);

    $AttendedMatch = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subDays(1)]);
    $AttendedMatch->participants()->create([
        'user_id' => $Player->id, 'source' => 'team', 'rsvp' => 'yes', 'attended' => true,
    ]);

    $NoShowMatch = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subDays(2)]);
    $NoShowMatch->participants()->create([
        'user_id' => $Player->id, 'source' => 'team', 'rsvp' => 'yes', 'attended' => false,
    ]);

    $this->actingAs($Viewer)->getJson("/api/v1/players/{$Player->public_id}/stats")
        ->assertOk()
        ->assertJsonPath('data.reliability', 50);
});

it('returns null reliability when no attendance has been recorded yet', function () {
    $Viewer = User::factory()->create();
    $Player = User::factory()->create();

    $this->actingAs($Viewer)->getJson("/api/v1/players/{$Player->public_id}/stats")
        ->assertOk()
        ->assertJsonPath('data.reliability', null);
});
