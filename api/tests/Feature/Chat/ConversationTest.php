<?php

use App\Models\Message;
use App\Models\Team;
use App\Models\User;

afterEach(function () {
    // Mongo test DB'si RefreshDatabase kapsamı dışında (spec: 07-notifications-chat.md, karar #2).
    Message::query()->delete();
});

it('lists my team chats and DM conversations together, newest last message first', function () {
    $Me = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Me->id, ['role' => 'captain', 'joined_at' => now()]);

    $Friend = User::factory()->create();

    $this->actingAs($Me)->postJson("/api/v1/teams/{$Team->public_id}/messages", [
        'type' => 'text',
        'body' => 'takım mesajı',
    ])->assertCreated();

    usleep(10000);

    $this->actingAs($Friend)->postJson("/api/v1/players/{$Me->public_id}/messages", [
        'type' => 'text',
        'body' => 'dm mesajı',
    ])->assertCreated();

    $Response = $this->actingAs($Me)->getJson('/api/v1/conversations')->assertOk();

    $Response->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.type', 'dm')
        ->assertJsonPath('data.0.last_message', 'dm mesajı')
        ->assertJsonPath('data.1.type', 'team')
        ->assertJsonPath('data.1.last_message', 'takım mesajı');
});

it('lists a team with no messages yet as a conversation with a null last message', function () {
    $Me = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Me->id, ['role' => 'captain', 'joined_at' => now()]);

    $Response = $this->actingAs($Me)->getJson('/api/v1/conversations')->assertOk();

    $Response->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'team')
        ->assertJsonPath('data.0.last_message', null);
});

it('returns an empty conversation list for a user with no teams or DMs', function () {
    $Me = User::factory()->create();

    $this->actingAs($Me)->getJson('/api/v1/conversations')->assertOk()->assertJsonCount(0, 'data');
});
