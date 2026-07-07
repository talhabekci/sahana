<?php

use App\Models\FootballMatch;
use App\Models\User;
use App\Notifications\MatchCreatedNotification;

it('lists notifications for the authenticated user', function () {
    $User = User::factory()->create();
    $Match = FootballMatch::factory()->create();
    $User->notify(new MatchCreatedNotification($Match));

    $this->actingAs($User)->getJson('/api/v1/notifications')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'MatchCreatedNotification')
        ->assertJsonPath('data.0.read', false);
});

it('marks a single notification as read', function () {
    $User = User::factory()->create();
    $Match = FootballMatch::factory()->create();
    $User->notify(new MatchCreatedNotification($Match));

    $NotificationId = $User->notifications()->first()->id;

    $this->actingAs($User)->postJson("/api/v1/notifications/{$NotificationId}/read")->assertOk();

    expect($User->notifications()->first()->read_at)->not->toBeNull();
});

it('rejects marking another users notification as read', function () {
    $Owner = User::factory()->create();
    $Other = User::factory()->create();
    $Match = FootballMatch::factory()->create();
    $Owner->notify(new MatchCreatedNotification($Match));

    $NotificationId = $Owner->notifications()->first()->id;

    $this->actingAs($Other)->postJson("/api/v1/notifications/{$NotificationId}/read")->assertStatus(404);
});

it('marks all notifications as read', function () {
    $User = User::factory()->create();
    $Match = FootballMatch::factory()->create();
    $User->notify(new MatchCreatedNotification($Match));
    $User->notify(new MatchCreatedNotification($Match));

    $this->actingAs($User)->postJson('/api/v1/notifications/read-all')->assertOk();

    expect($User->unreadNotifications()->count())->toBe(0);
});
