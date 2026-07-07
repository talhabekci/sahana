<?php

use App\Events\MessageSent;
use App\Models\Block;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\Event;

afterEach(function () {
    // Mongo test DB'si RefreshDatabase kapsamı dışında (spec: 07-notifications-chat.md, karar #2).
    Message::query()->delete();
});

it('lets a user send a text DM and broadcasts it on the sorted public_id channel', function () {
    Event::fake([MessageSent::class]);

    $Me = User::factory()->create();
    $Other = User::factory()->create();

    $this->actingAs($Me)->postJson("/api/v1/players/{$Other->public_id}/messages", [
        'type' => 'text',
        'body' => 'Selam, maça geliyor musun?',
    ])->assertCreated()
        ->assertJsonPath('data.type', 'text')
        ->assertJsonPath('data.body', 'Selam, maça geliyor musun?')
        ->assertJsonPath('data.author.id', $Me->public_id);

    $Ids = collect([$Me->id, $Other->id])->sort()->values()->all();
    $this->assertDatabaseHas('messages', ['participant_ids' => $Ids, 'user_id' => $Me->id], 'mongodb');

    $PublicIds = collect([$Me->public_id, $Other->public_id])->sort()->values()->all();

    Event::assertDispatched(
        MessageSent::class,
        fn (MessageSent $Event): bool => $Event->broadcastOn()[0]->name === "private-dm.{$PublicIds[0]}.{$PublicIds[1]}",
    );
});

it('rejects sending a DM to yourself', function () {
    $Me = User::factory()->create();

    $this->actingAs($Me)->postJson("/api/v1/players/{$Me->public_id}/messages", [
        'type' => 'text',
        'body' => 'selam',
    ])->assertStatus(422);
});

it('rejects sending a DM to a blocked user', function () {
    $Me = User::factory()->create();
    $Other = User::factory()->create();
    Block::create(['user_id' => $Me->id, 'blocked_user_id' => $Other->id]);

    $this->actingAs($Me)->postJson("/api/v1/players/{$Other->public_id}/messages", [
        'type' => 'text',
        'body' => 'selam',
    ])->assertStatus(404);
});

it('rejects a match_ref or lineup_ref type for DMs', function () {
    $Me = User::factory()->create();
    $Other = User::factory()->create();

    $this->actingAs($Me)->postJson("/api/v1/players/{$Other->public_id}/messages", [
        'type' => 'match_ref',
        'match_id' => 'whatever',
    ])->assertStatus(422);
});

it('lists DM messages between two users, newest first, regardless of who sent them', function () {
    $Me = User::factory()->create();
    $Other = User::factory()->create();

    $this->actingAs($Me)->postJson("/api/v1/players/{$Other->public_id}/messages", ['type' => 'text', 'body' => 'ilk'])->assertCreated();
    usleep(10000);
    $this->actingAs($Other)->postJson("/api/v1/players/{$Me->public_id}/messages", ['type' => 'text', 'body' => 'ikinci'])->assertCreated();

    $Response = $this->actingAs($Me)->getJson("/api/v1/players/{$Other->public_id}/messages")->assertOk();

    $Response->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.body', 'ikinci')
        ->assertJsonPath('data.1.body', 'ilk');
});

it('does not leak DMs between unrelated user pairs', function () {
    $Me = User::factory()->create();
    $Other = User::factory()->create();
    $ThirdParty = User::factory()->create();

    $this->actingAs($Me)->postJson("/api/v1/players/{$Other->public_id}/messages", ['type' => 'text', 'body' => 'gizli'])->assertCreated();

    $Response = $this->actingAs($ThirdParty)->getJson("/api/v1/players/{$Other->public_id}/messages")->assertOk();

    $Response->assertJsonCount(0, 'data');
});
