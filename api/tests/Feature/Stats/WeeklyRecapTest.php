<?php

use App\Models\FootballMatch;
use App\Models\PlayerMatchStat;
use App\Models\PlayerProfile;
use App\Models\PlayerRating;
use App\Models\Post;
use App\Models\Team;
use App\Models\User;

it('creates a weekly recap post for a player with activity in the last 7 days', function () {
    $Player = User::factory()->create();
    PlayerProfile::factory()->for($Player)->create();

    $Team = Team::factory()->create();
    $Team->members()->attach($Player->id, ['role' => 'member', 'joined_at' => now()]);
    $Rater = User::factory()->create();
    $Team->members()->attach($Rater->id, ['role' => 'member', 'joined_at' => now()]);

    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subDays(2)]);
    $Match->participants()->create(['user_id' => $Player->id, 'source' => 'team', 'rsvp' => 'yes']);
    PlayerMatchStat::create([
        'match_id' => $Match->id, 'user_id' => $Player->id,
        'goals' => 2, 'assists' => 1, 'approved' => true, 'entered_by' => $Player->id,
    ]);
    PlayerRating::create([
        'match_id' => $Match->id, 'rater_id' => $Rater->id, 'ratee_id' => $Player->id, 'score' => 8,
    ]);

    $this->artisan('recap:weekly')->assertSuccessful();

    $Post = Post::where('user_id', $Player->id)->where('type', 'weekly_recap')->first();

    expect($Post)->not->toBeNull()
        ->and($Post->recap_data['matches'])->toBe(1)
        ->and($Post->recap_data['goals'])->toBe(2)
        ->and($Post->recap_data['assists'])->toBe(1)
        ->and((float) $Post->recap_data['avg_rating'])->toBe(8.0);

    expect($Player->profile->fresh()->last_weekly_recap_at)->not->toBeNull();
});

it('skips players with no matches in the last 7 days', function () {
    $Player = User::factory()->create();
    PlayerProfile::factory()->for($Player)->create();

    $this->artisan('recap:weekly')->assertSuccessful();

    expect(Post::where('user_id', $Player->id)->where('type', 'weekly_recap')->exists())->toBeFalse()
        ->and($Player->profile->fresh()->last_weekly_recap_at)->not->toBeNull();
});

it('does not run again for a player recapped within the last 6 days', function () {
    $Player = User::factory()->create();
    PlayerProfile::factory()->for($Player)->create(['last_weekly_recap_at' => now()->subDays(2)]);

    $Team = Team::factory()->create();
    $Team->members()->attach($Player->id, ['role' => 'member', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subDay()]);
    $Match->participants()->create(['user_id' => $Player->id, 'source' => 'team', 'rsvp' => 'yes']);

    $this->artisan('recap:weekly')->assertSuccessful();

    expect(Post::where('user_id', $Player->id)->where('type', 'weekly_recap')->exists())->toBeFalse();
});

it('does not create a recap post when auto_posts_enabled is false but still updates the checkpoint', function () {
    $Player = User::factory()->create();
    PlayerProfile::factory()->for($Player)->create(['auto_posts_enabled' => false]);

    $Team = Team::factory()->create();
    $Team->members()->attach($Player->id, ['role' => 'member', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subDay()]);
    $Match->participants()->create(['user_id' => $Player->id, 'source' => 'team', 'rsvp' => 'yes']);

    $this->artisan('recap:weekly')->assertSuccessful();

    expect(Post::where('user_id', $Player->id)->where('type', 'weekly_recap')->exists())->toBeFalse()
        ->and($Player->profile->fresh()->last_weekly_recap_at)->not->toBeNull();
});
