<?php

use App\Models\User;

it('registers a device push token', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/me/devices', [
        'expo_push_token' => 'ExponentPushToken[abc123]',
        'platform' => 'ios',
    ])->assertCreated()->assertJsonPath('data.status', 'registered');

    $this->assertDatabaseHas('devices', [
        'user_id' => $User->id,
        'expo_push_token' => 'ExponentPushToken[abc123]',
        'platform' => 'ios',
    ]);
});

it('upserts when the same token is registered again by a different user', function () {
    $First = User::factory()->create();
    $Second = User::factory()->create();

    $this->actingAs($First)->postJson('/api/v1/me/devices', [
        'expo_push_token' => 'ExponentPushToken[shared]',
        'platform' => 'android',
    ])->assertCreated();

    $this->actingAs($Second)->postJson('/api/v1/me/devices', [
        'expo_push_token' => 'ExponentPushToken[shared]',
        'platform' => 'android',
    ])->assertCreated();

    $this->assertDatabaseCount('devices', 1);
    $this->assertDatabaseHas('devices', ['user_id' => $Second->id, 'expo_push_token' => 'ExponentPushToken[shared]']);
});

it('validates the platform value', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/me/devices', [
        'expo_push_token' => 'ExponentPushToken[abc]',
        'platform' => 'windows',
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});
