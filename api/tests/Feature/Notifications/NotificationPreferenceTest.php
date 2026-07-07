<?php

use App\Models\User;

function preferenceTestUser(): User
{
    $User = User::factory()->create();
    $User->profile()->create([
        'positions' => ['kaleci'],
        'level' => 3,
        'city_id' => 34,
    ]);

    return $User;
}

it('defaults to all categories on and quiet hours enabled', function () {
    $User = preferenceTestUser();

    $this->actingAs($User)->getJson('/api/v1/me/notification-preferences')
        ->assertOk()
        ->assertJsonPath('data.quiet_hours_enabled', true)
        ->assertJsonPath('data.categories.match_created', true)
        ->assertJsonPath('data.categories.chat_message', true);
});

it('lets the user turn off a single category and quiet hours', function () {
    $User = preferenceTestUser();

    $this->actingAs($User)->patchJson('/api/v1/me/notification-preferences', [
        'quiet_hours_enabled' => false,
        'categories' => ['social_summary' => false],
    ])->assertOk()
        ->assertJsonPath('data.quiet_hours_enabled', false)
        ->assertJsonPath('data.categories.social_summary', false)
        ->assertJsonPath('data.categories.match_created', true);
});

it('rejects an unknown category key', function () {
    $User = preferenceTestUser();

    $this->actingAs($User)->patchJson('/api/v1/me/notification-preferences', [
        'categories' => ['not_a_real_category' => false],
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});
