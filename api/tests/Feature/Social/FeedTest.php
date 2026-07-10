<?php

use App\Models\Block;
use App\Models\Follow;
use App\Models\FootballMatch;
use App\Models\Post;
use App\Models\Team;
use App\Models\User;

it('includes posts from followed users and own teams, chronologically', function () {
    $Viewer = User::factory()->create();
    $Followed = User::factory()->create();
    Follow::create(['follower_id' => $Viewer->id, 'followed_id' => $Followed->id]);

    $Team = Team::factory()->create();
    $Team->members()->attach($Viewer->id, ['role' => 'captain', 'joined_at' => now()]);
    $Teammate = User::factory()->create();
    $Team->members()->attach($Teammate->id, ['role' => 'member', 'joined_at' => now()]);

    $Older = Post::factory()->for($Followed, 'user')->create(['created_at' => now()->subHour()]);
    $Newer = Post::factory()->for($Teammate, 'user')->create(['team_id' => $Team->id]);

    $Stranger = User::factory()->create();
    Post::factory()->for($Stranger, 'user')->create();

    $Response = $this->actingAs($Viewer)->getJson('/api/v1/feed')->assertOk();

    $Ids = collect($Response->json('data'))->pluck('id');

    expect($Ids)->toHaveCount(2)
        ->and($Ids->first())->toBe($Newer->public_id)
        ->and($Ids->last())->toBe($Older->public_id);
});

it('excludes posts from a blocked user in either direction', function () {
    $Viewer = User::factory()->create();
    $Blocked = User::factory()->create();
    Follow::create(['follower_id' => $Viewer->id, 'followed_id' => $Blocked->id]);
    Block::create(['user_id' => $Viewer->id, 'blocked_user_id' => $Blocked->id]);

    Post::factory()->for($Blocked, 'user')->create();

    $Response = $this->actingAs($Viewer)->getJson('/api/v1/feed')->assertOk();

    expect($Response->json('data'))->toHaveCount(0);
});

it('auto-posts a match_played card when a confirmed match sweeps to played', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $Match = FootballMatch::factory()->for($Team)->create(['starts_at' => now()->subHour()]);
    $Match->forceFill(['status' => 'confirmed'])->save();

    $this->artisan('matches:sweep')->assertSuccessful();

    $this->assertDatabaseHas('posts', [
        'type' => 'match_played',
        'match_id' => $Match->id,
        'team_id' => $Team->id,
    ]);
});

it('skips the auto match_played post when the creator disabled auto posts', function () {
    $Captain = User::factory()->create();
    $Captain->profile()->create([
        'positions' => ['kaleci'],
        'level' => 3,
        'city_id' => 34,
        'auto_posts_enabled' => false,
    ]);
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $Match = FootballMatch::factory()->for($Team)->create([
        'starts_at' => now()->subHour(),
        'created_by' => $Captain->id,
    ]);
    $Match->forceFill(['status' => 'confirmed'])->save();

    $this->artisan('matches:sweep')->assertSuccessful();

    $this->assertDatabaseMissing('posts', ['type' => 'match_played', 'match_id' => $Match->id]);
});

it('auto-posts a lineup_shared card when a lineup is created', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/lineups", [
        'name' => 'Perşembe Kadrosu',
        'positions' => [['id' => 'gk', 'x' => 0.5, 'y' => 0.95]],
    ])->assertCreated();

    $this->assertDatabaseHas('posts', [
        'type' => 'lineup_shared',
        'team_id' => $Team->id,
        'user_id' => $Captain->id,
    ]);
});

it('auto-posts a player_listing card when a listing is created', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['created_by' => $Captain->id]);

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/listings", [
        'positions_needed' => ['defans'],
        'needed_count' => 1,
        'level_min' => 1,
        'level_max' => 5,
        'lat' => 41.0,
        'lng' => 29.0,
    ])->assertCreated();

    $this->assertDatabaseHas('posts', [
        'type' => 'player_listing',
        'team_id' => $Team->id,
        'user_id' => $Captain->id,
    ]);
});

it('skips the auto player_listing post when the creator disabled auto posts', function () {
    $Captain = User::factory()->create();
    $Captain->profile()->create([
        'positions' => ['kaleci'],
        'level' => 3,
        'city_id' => 34,
        'auto_posts_enabled' => false,
    ]);
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['created_by' => $Captain->id]);

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/listings", [
        'positions_needed' => ['defans'],
        'needed_count' => 1,
        'level_min' => 1,
        'level_max' => 5,
        'lat' => 41.0,
        'lng' => 29.0,
    ])->assertCreated();

    $this->assertDatabaseMissing('posts', ['type' => 'player_listing', 'team_id' => $Team->id]);
});

it('auto-posts an opponent_listing card when an opponent listing is created', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $this->actingAs($Captain)->postJson('/api/v1/opponent-listings', [
        'team_id' => $Team->public_id,
    ])->assertCreated();

    $this->assertDatabaseHas('posts', [
        'type' => 'opponent_listing',
        'team_id' => $Team->id,
        'user_id' => $Captain->id,
    ]);
});

it('includes a player_listing post in the feed with the viewers own application status', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Match = FootballMatch::factory()->for($Team)->create(['created_by' => $Captain->id]);

    $ListingId = $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/listings", [
        'positions_needed' => ['defans'],
        'needed_count' => 1,
        'level_min' => 1,
        'level_max' => 5,
        'lat' => 41.0,
        'lng' => 29.0,
    ])->json('data.id');

    $Applicant = User::factory()->create();
    Follow::create(['follower_id' => $Applicant->id, 'followed_id' => $Captain->id]);
    $this->actingAs($Applicant)->postJson("/api/v1/listings/{$ListingId}/applications")->assertCreated();

    $Response = $this->actingAs($Applicant)->getJson('/api/v1/feed')->assertOk();

    // "applications" bilinçli olarak eager-load edilmiyor (performans) — key hiç gelmemeli.
    expect($Response->json('data.0.type'))->toBe('player_listing')
        ->and($Response->json('data.0.player_listing.my_application_status'))->toBe('pending')
        ->and($Response->json('data.0.player_listing'))->not->toHaveKey('applications');
});
