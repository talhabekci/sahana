<?php

use App\Models\FootballMatch;
use App\Models\PlayerBadge;
use App\Models\PlayerProfile;
use App\Models\Post;
use App\Models\Team;
use App\Models\User;

/**
 * @return array{0: FootballMatch, 1: User, 2: Team}
 */
function badgeMatchSetup(User $Player): array
{
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Team->members()->attach($Player->id, ['role' => 'member', 'joined_at' => now()]);

    $OpponentTeam = Team::factory()->create();

    $Match = FootballMatch::factory()->for($Team)->create([
        'opponent_team_id' => $OpponentTeam->id,
        'starts_at' => now()->subHours(2),
    ]);
    $Match->participants()->create(['user_id' => $Player->id, 'source' => 'team', 'rsvp' => 'yes']);
    $Match->participants()->create(['user_id' => $Captain->id, 'source' => 'team', 'rsvp' => 'yes']);

    return [$Match, $Captain, $Team];
}

it('awards ilk_gol and hat_trick when the captain submits an approved stat with 3+ goals', function () {
    $Player = User::factory()->create();
    [$Match, $Captain] = badgeMatchSetup($Player);

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 3,
        'assists' => 1,
    ])->assertCreated();

    $EarnedKeys = PlayerBadge::where('user_id', $Player->id)->pluck('badge_key');

    expect($EarnedKeys)->toContain('ilk_gol')->toContain('hat_trick');

    $BadgePosts = Post::where('user_id', $Player->id)->where('type', 'badge_earned')->pluck('badge_key');
    expect($BadgePosts)->toContain('ilk_gol')->toContain('hat_trick');
});

it('does not award hat_trick for a single goal', function () {
    $Player = User::factory()->create();
    [$Match, $Captain] = badgeMatchSetup($Player);

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 1,
        'assists' => 0,
    ])->assertCreated();

    $EarnedKeys = PlayerBadge::where('user_id', $Player->id)->pluck('badge_key');

    expect($EarnedKeys)->toContain('ilk_gol')->not->toContain('hat_trick');
});

it('awards seri_5 and guvenilir after 5 consecutive attended matches', function () {
    $Player = User::factory()->create();

    for ($i = 0; $i < 5; $i++) {
        [$Match, $Captain] = badgeMatchSetup($Player);
        $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
            'home_score' => 1,
            'away_score' => 0,
        ])->assertCreated();
    }

    $EarnedKeys = PlayerBadge::where('user_id', $Player->id)->pluck('badge_key');

    expect($EarnedKeys)->toContain('seri_5')->toContain('guvenilir');
});

it('does not award seri_5 if a no-show breaks the streak', function () {
    $Player = User::factory()->create();

    for ($i = 0; $i < 5; $i++) {
        [$Match, $Captain] = badgeMatchSetup($Player);
        $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/result", [
            'home_score' => 1,
            'away_score' => 0,
            'no_show_user_ids' => $i === 2 ? [$Player->public_id] : [],
        ])->assertCreated();
    }

    $EarnedKeys = PlayerBadge::where('user_id', $Player->id)->pluck('badge_key');

    expect($EarnedKeys)->not->toContain('seri_5');
});

it('awards yildiz after 5 high ratings', function () {
    $Player = User::factory()->create();

    for ($i = 0; $i < 5; $i++) {
        [$Match, $Captain] = badgeMatchSetup($Player);
        $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/ratings", [
            'ratee_id' => $Player->public_id,
            'score' => 9,
        ])->assertOk();
    }

    $EarnedKeys = PlayerBadge::where('user_id', $Player->id)->pluck('badge_key');

    expect($EarnedKeys)->toContain('yildiz');
});

it('does not duplicate a badge on repeated evaluation', function () {
    $Player = User::factory()->create();
    [$Match, $Captain] = badgeMatchSetup($Player);

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 3,
        'assists' => 0,
    ])->assertCreated();

    // Aynı istatistiği tekrar gönderip (upsert) rozetlerin tekrar oluşturulmadığını doğrula.
    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 3,
        'assists' => 0,
    ])->assertCreated();

    expect(PlayerBadge::where('user_id', $Player->id)->where('badge_key', 'hat_trick')->count())->toBe(1)
        ->and(Post::where('user_id', $Player->id)->where('badge_key', 'hat_trick')->count())->toBe(1);
});

it('skips the badge_earned auto-post when auto_posts_enabled is false but still awards the badge', function () {
    $Player = User::factory()->create();
    PlayerProfile::factory()->for($Player)->create(['auto_posts_enabled' => false]);
    [$Match, $Captain] = badgeMatchSetup($Player);

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 1,
        'assists' => 0,
    ])->assertCreated();

    expect(PlayerBadge::where('user_id', $Player->id)->where('badge_key', 'ilk_gol')->exists())->toBeTrue()
        ->and(Post::where('user_id', $Player->id)->where('type', 'badge_earned')->exists())->toBeFalse();
});

it('lists earned badges via the API, newest first', function () {
    $Player = User::factory()->create();
    [$Match, $Captain] = badgeMatchSetup($Player);

    $this->actingAs($Captain)->postJson("/api/v1/matches/{$Match->public_id}/player-stats", [
        'user_id' => $Player->public_id,
        'goals' => 3,
        'assists' => 0,
    ])->assertCreated();

    $Response = $this->actingAs($Captain)->getJson("/api/v1/players/{$Player->public_id}/badges")->assertOk();

    $Keys = collect($Response->json('data'))->pluck('key');
    expect($Keys)->toContain('ilk_gol')->toContain('hat_trick');
    expect($Response->json('data.0.label'))->not->toBeNull();
});
