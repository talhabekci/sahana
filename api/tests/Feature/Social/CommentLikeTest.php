<?php

use App\Models\Block;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;

it('likes and unlikes a post idempotently', function () {
    $User = User::factory()->create();
    $Post = Post::factory()->create();

    $this->actingAs($User)->postJson("/api/v1/posts/{$Post->public_id}/like")->assertOk();
    $this->actingAs($User)->postJson("/api/v1/posts/{$Post->public_id}/like")->assertOk();

    expect($Post->likes()->count())->toBe(1);

    $this->actingAs($User)->deleteJson("/api/v1/posts/{$Post->public_id}/like")->assertOk();
    $this->actingAs($User)->deleteJson("/api/v1/posts/{$Post->public_id}/like")->assertOk();

    expect($Post->likes()->count())->toBe(0);
});

it('adds a comment and lists it', function () {
    $User = User::factory()->create();
    $Post = Post::factory()->create();

    $this->actingAs($User)->postJson("/api/v1/posts/{$Post->public_id}/comments", [
        'body' => 'Harika oynadın!',
    ])->assertCreated()->assertJsonPath('data.body', 'Harika oynadın!');

    $this->actingAs($User)->getJson("/api/v1/posts/{$Post->public_id}/comments")
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('rejects a profane comment', function () {
    $User = User::factory()->create();
    $Post = Post::factory()->create();

    $this->actingAs($User)->postJson("/api/v1/posts/{$Post->public_id}/comments", [
        'body' => 'siktir git',
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('lets the owner delete their own comment only', function () {
    $Author = User::factory()->create();
    $Stranger = User::factory()->create();
    $Comment = Comment::factory()->for($Author, 'user')->create();

    $this->actingAs($Stranger)->deleteJson('/api/v1/comments/'.$Comment->public_id)->assertStatus(403);
    $this->actingAs($Author)->deleteJson('/api/v1/comments/'.$Comment->public_id)->assertOk();
});

it('prevents commenting when blocked with the post author', function () {
    $Author = User::factory()->create();
    $Blocked = User::factory()->create();
    Block::create(['user_id' => $Author->id, 'blocked_user_id' => $Blocked->id]);

    $Post = Post::factory()->for($Author, 'user')->create();

    $this->actingAs($Blocked)->postJson("/api/v1/posts/{$Post->public_id}/comments", [
        'body' => 'Selam',
    ])->assertStatus(403);
});
