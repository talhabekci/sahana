<?php

use App\Models\Post;
use App\Models\Team;
use App\Models\User;

it('follows and unfollows a player', function () {
    $Viewer = User::factory()->create();
    $Target = User::factory()->create();

    $this->actingAs($Viewer)->postJson("/api/v1/players/{$Target->public_id}/follow")->assertOk();
    expect($Viewer->fresh()->isFollowing($Target))->toBeTrue();

    $this->actingAs($Viewer)->deleteJson("/api/v1/players/{$Target->public_id}/follow")->assertOk();
    expect($Viewer->fresh()->isFollowing($Target))->toBeFalse();
});

it('rejects following yourself', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson("/api/v1/players/{$User->public_id}/follow")
        ->assertStatus(422)->assertJsonPath('code', 'cannot_follow_self');
});

it('blocking removes the follow relationship in both directions', function () {
    $Viewer = User::factory()->create();
    $Target = User::factory()->create();

    $this->actingAs($Viewer)->postJson("/api/v1/players/{$Target->public_id}/follow")->assertOk();
    $this->actingAs($Target)->postJson("/api/v1/players/{$Viewer->public_id}/follow")->assertOk();

    $this->actingAs($Viewer)->postJson("/api/v1/players/{$Target->public_id}/block")->assertOk();

    expect($Viewer->fresh()->isFollowing($Target))->toBeFalse()
        ->and($Target->fresh()->isFollowing($Viewer))->toBeFalse()
        ->and($Viewer->fresh()->hasBlocked($Target))->toBeTrue();
});

it('hides a blocked players posts from the players/{id}/posts endpoint', function () {
    $Viewer = User::factory()->create();
    $Blocked = User::factory()->create();
    Post::factory()->for($Blocked, 'user')->create();

    $this->actingAs($Viewer)->postJson("/api/v1/players/{$Blocked->public_id}/block")->assertOk();

    $this->actingAs($Viewer)->getJson("/api/v1/players/{$Blocked->public_id}/posts")->assertStatus(404);
});

it('reports a post', function () {
    $Reporter = User::factory()->create();
    $Post = Post::factory()->create();

    $this->actingAs($Reporter)->postJson('/api/v1/reports', [
        'subject_type' => 'post',
        'subject_id' => $Post->public_id,
        'reason' => 'Uygunsuz içerik',
    ])->assertCreated();

    $this->assertDatabaseHas('reports', [
        'reporter_id' => $Reporter->id,
        'subject_type' => 'post',
        'subject_id' => $Post->id,
    ]);
});

it('reports a user', function () {
    $Reporter = User::factory()->create();
    $Target = User::factory()->create();

    $this->actingAs($Reporter)->postJson('/api/v1/reports', [
        'subject_type' => 'user',
        'subject_id' => $Target->public_id,
        'reason' => 'Taciz',
    ])->assertCreated();
});

it('searches players and teams by name', function () {
    User::factory()->create(['name' => 'Mehmet Yılmaz']);
    User::factory()->create(['name' => 'Ahmet Demir']);
    Team::factory()->create(['name' => 'Mehmet FK']);

    $Searcher = User::factory()->create();

    $Players = $this->actingAs($Searcher)->getJson('/api/v1/search?q=Mehmet&type=player')->assertOk();
    expect($Players->json('data'))->toHaveCount(1);

    $Teams = $this->actingAs($Searcher)->getJson('/api/v1/search?q=Mehmet&type=team')->assertOk();
    expect($Teams->json('data'))->toHaveCount(1);
});
