<?php

use App\Events\MessageSent;
use App\Models\FootballMatch;
use App\Models\Message;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Event;

afterEach(function () {
    // Mongo test DB'si RefreshDatabase kapsamı dışında (spec: 07-notifications-chat.md, karar #2).
    Message::query()->delete();
});

/**
 * @return array{0: Team, 1: User, 2: User}
 */
function chatTeamSetup(): array
{
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $Member = User::factory()->create();
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    return [$Team, $Captain, $Member];
}

it('lets a team member send a text message and broadcasts it', function () {
    Event::fake([MessageSent::class]);

    [$Team, $Captain] = chatTeamSetup();

    $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/messages", [
        'type' => 'text',
        'body' => 'Bu akşam saat kaçta buluşuyoruz?',
    ])->assertCreated()
        ->assertJsonPath('data.type', 'text')
        ->assertJsonPath('data.body', 'Bu akşam saat kaçta buluşuyoruz?')
        ->assertJsonPath('data.author.id', $Captain->public_id);

    $this->assertDatabaseHas('messages', ['team_id' => $Team->id, 'user_id' => $Captain->id], 'mongodb');

    // Regresyon: WS kanal adı public_id ile kurulmalı — mobil de team_id
    // değil public_id dinliyor (bkz. 07-notifications-chat.md, "Bulunan hata").
    Event::assertDispatched(
        MessageSent::class,
        fn (MessageSent $Event): bool => $Event->broadcastOn()[0]->name === "private-team.{$Team->public_id}",
    );
});

it('rejects sending a message from a non-member', function () {
    [$Team] = chatTeamSetup();
    $Outsider = User::factory()->create();

    $this->actingAs($Outsider)->postJson("/api/v1/teams/{$Team->public_id}/messages", [
        'type' => 'text',
        'body' => 'selam',
    ])->assertStatus(403);
});

it('validates that a text message has a body', function () {
    [$Team, $Captain] = chatTeamSetup();

    $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/messages", [
        'type' => 'text',
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('lets a member share a match reference belonging to the team', function () {
    [$Team, $Captain] = chatTeamSetup();
    $Match = FootballMatch::factory()->for($Team)->create();

    $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/messages", [
        'type' => 'match_ref',
        'match_id' => $Match->public_id,
    ])->assertCreated()->assertJsonPath('data.match_id', $Match->public_id);
});

it('rejects a match reference belonging to another team', function () {
    [$Team, $Captain] = chatTeamSetup();
    $OtherTeam = Team::factory()->create();
    $Match = FootballMatch::factory()->for($OtherTeam)->create();

    $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/messages", [
        'type' => 'match_ref',
        'match_id' => $Match->public_id,
    ])->assertStatus(404);
});

it('lets a member share a lineup reference belonging to the team', function () {
    [$Team, $Captain] = chatTeamSetup();
    $Lineup = $Team->lineups()->create([
        'name' => 'Perşembe Kadrosu',
        'positions' => [['id' => 'gk', 'x' => 0.5, 'y' => 0.95]],
    ]);

    $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/messages", [
        'type' => 'lineup_ref',
        'lineup_id' => $Lineup->public_id,
    ])->assertCreated()->assertJsonPath('data.lineup_id', $Lineup->public_id);
});

it('lists messages for a team member, newest first', function () {
    [$Team, $Captain] = chatTeamSetup();

    $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/messages", ['type' => 'text', 'body' => 'ilk'])->assertCreated();
    usleep(10000);
    $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/messages", ['type' => 'text', 'body' => 'ikinci'])->assertCreated();

    $Response = $this->actingAs($Captain)->getJson("/api/v1/teams/{$Team->public_id}/messages")->assertOk();

    $Response->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.body', 'ikinci')
        ->assertJsonPath('data.1.body', 'ilk');
});

it('paginates messages with a before cursor', function () {
    [$Team, $Captain] = chatTeamSetup();

    foreach (range(1, 3) as $Index) {
        $this->actingAs($Captain)->postJson("/api/v1/teams/{$Team->public_id}/messages", [
            'type' => 'text',
            'body' => "mesaj-{$Index}",
        ])->assertCreated();
        usleep(10000);
    }

    $FirstPage = $this->actingAs($Captain)
        ->getJson("/api/v1/teams/{$Team->public_id}/messages?limit=2")
        ->assertOk();

    $FirstPage->assertJsonCount(2, 'data');
    $Cursor = $FirstPage->json('meta.next_cursor');
    expect($Cursor)->not->toBeNull();

    $SecondPage = $this->actingAs($Captain)
        ->getJson("/api/v1/teams/{$Team->public_id}/messages?limit=2&before={$Cursor}")
        ->assertOk();

    $SecondPage->assertJsonCount(1, 'data')->assertJsonPath('data.0.body', 'mesaj-1');
});

it('rejects listing messages for a non-member', function () {
    [$Team] = chatTeamSetup();
    $Outsider = User::factory()->create();

    $this->actingAs($Outsider)->getJson("/api/v1/teams/{$Team->public_id}/messages")->assertStatus(403);
});
