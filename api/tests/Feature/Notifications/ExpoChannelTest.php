<?php

use App\Jobs\SendExpoPush;
use App\Models\FootballMatch;
use App\Models\Message;
use App\Models\Team;
use App\Models\User;
use App\Notifications\ChatMessageNotification;
use App\Notifications\MatchCreatedNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;

afterEach(function () {
    Carbon::setTestNow();
});

it('skips the push entirely when the recipient disabled the category', function () {
    Queue::fake([SendExpoPush::class]);

    $User = User::factory()->create();
    $User->profile()->create([
        'positions' => ['kaleci'],
        'level' => 3,
        'city_id' => 34,
        'notification_preferences' => ['match_created' => false],
    ]);
    $User->devices()->create(['expo_push_token' => 'ExponentPushToken[x]', 'platform' => 'ios']);

    $Match = FootballMatch::factory()->create();
    $User->notify(new MatchCreatedNotification($Match));

    Queue::assertNotPushed(SendExpoPush::class);
});

it('delays the push during quiet hours for a quiet-hours-subject category', function () {
    Carbon::setTestNow(Carbon::parse('2026-01-01 00:00:00', 'UTC')); // 03:00 Europe/Istanbul
    Queue::fake([SendExpoPush::class]);

    $User = User::factory()->create();
    $User->profile()->create(['positions' => ['kaleci'], 'level' => 3, 'city_id' => 34]);
    $User->devices()->create(['expo_push_token' => 'ExponentPushToken[x]', 'platform' => 'ios']);

    $Match = FootballMatch::factory()->create();
    $User->notify(new MatchCreatedNotification($Match));

    Queue::assertPushed(SendExpoPush::class, fn ($Job): bool => $Job->delay !== null);
});

it('does not delay a chat_message push even during quiet hours', function () {
    Carbon::setTestNow(Carbon::parse('2026-01-01 00:00:00', 'UTC')); // 03:00 Europe/Istanbul
    Queue::fake([SendExpoPush::class]);

    $Sender = User::factory()->create();
    $Recipient = User::factory()->create();
    $Recipient->profile()->create(['positions' => ['kaleci'], 'level' => 3, 'city_id' => 34]);
    $Recipient->devices()->create(['expo_push_token' => 'ExponentPushToken[x]', 'platform' => 'ios']);

    $Team = Team::factory()->create();
    $Message = Message::create(['team_id' => $Team->id, 'user_id' => $Sender->id, 'type' => 'text', 'body' => 'selam']);

    $Recipient->notify(new ChatMessageNotification($Team, $Sender, $Message));

    Queue::assertPushed(SendExpoPush::class, fn ($Job): bool => $Job->delay === null);

    Message::where('team_id', $Team->id)->delete();
});

it('sends immediately outside quiet hours', function () {
    Carbon::setTestNow(Carbon::parse('2026-01-01 11:00:00', 'UTC')); // 14:00 Europe/Istanbul
    Queue::fake([SendExpoPush::class]);

    $User = User::factory()->create();
    $User->profile()->create(['positions' => ['kaleci'], 'level' => 3, 'city_id' => 34]);
    $User->devices()->create(['expo_push_token' => 'ExponentPushToken[x]', 'platform' => 'ios']);

    $Match = FootballMatch::factory()->create();
    $User->notify(new MatchCreatedNotification($Match));

    Queue::assertPushed(SendExpoPush::class, fn ($Job): bool => $Job->delay === null);
});
