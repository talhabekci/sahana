<?php

use App\Models\Follow;
use App\Models\PlayerProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('returns the authenticated user with profile', function () {
    $User = User::factory()->create();
    PlayerProfile::factory()->for($User)->create(['city_id' => 34]);

    $this->actingAs($User)->getJson('/api/v1/me')
        ->assertOk()
        ->assertJsonPath('data.id', $User->public_id)
        ->assertJsonPath('data.profile.city', 'İstanbul');
});

it('returns followers and following counts', function () {
    $User = User::factory()->create();
    $Follower = User::factory()->create();
    $Followed = User::factory()->create();

    Follow::create(['follower_id' => $Follower->id, 'followed_id' => $User->id]);
    Follow::create(['follower_id' => $User->id, 'followed_id' => $Followed->id]);

    $this->actingAs($User)->getJson('/api/v1/me')
        ->assertOk()
        ->assertJsonPath('data.followers_count', 1)
        ->assertJsonPath('data.following_count', 1);
});

it('requires authentication', function () {
    $this->getJson('/api/v1/me')
        ->assertStatus(401)
        ->assertJsonPath('code', 'unauthenticated');
});

it('creates the player profile on first update', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->patchJson('/api/v1/me', [
        'name' => 'Talha',
        'positions' => ['forvet', 'orta_saha'],
        'level' => 3,
        'city_id' => 34,
        'district' => 'Kadıköy',
    ])->assertOk()
        ->assertJsonPath('data.name', 'Talha')
        ->assertJsonPath('data.profile.level', 3);

    $this->assertDatabaseHas('player_profiles', ['user_id' => $User->id, 'level' => 3]);
});

it('updates an existing profile partially', function () {
    $User = User::factory()->create();
    PlayerProfile::factory()->for($User)->create(['level' => 2]);

    $this->actingAs($User)->patchJson('/api/v1/me', ['level' => 5])
        ->assertOk()
        ->assertJsonPath('data.profile.level', 5);
});

it('updates the birth date', function () {
    $User = User::factory()->create();
    PlayerProfile::factory()->for($User)->create();

    $this->actingAs($User)->patchJson('/api/v1/me', ['birth_date' => '1998-05-20'])
        ->assertOk()
        ->assertJsonPath('data.profile.birth_date', '1998-05-20');
});

it('rejects a birth date in the future', function () {
    $User = User::factory()->create();
    PlayerProfile::factory()->for($User)->create();

    $this->actingAs($User)->patchJson('/api/v1/me', ['birth_date' => now()->addDay()->toDateString()])
        ->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('lets the user upload a profile photo', function () {
    Storage::fake('public');
    $User = User::factory()->create();

    $Response = $this->actingAs($User)->post('/api/v1/me', [
        '_method' => 'PATCH',
        'avatar' => UploadedFile::fake()->image('avatar.jpg', 200, 200),
    ])->assertOk();

    expect($Response->json('data.avatar_path'))->not->toBeNull();

    $User->refresh();
    Storage::disk('public')->assertExists($User->avatar_path);
});

it('rejects a corrupt file as a profile photo', function () {
    Storage::fake('public');
    $User = User::factory()->create();

    $this->actingAs($User)->post('/api/v1/me', [
        '_method' => 'PATCH',
        'avatar' => UploadedFile::fake()->create('fake.jpg', 10, 'image/jpeg'),
    ])->assertStatus(422)->assertJsonPath('code', 'invalid_image');
});

it('rejects first profile creation with missing required fields', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->patchJson('/api/v1/me', ['positions' => ['forvet']])
        ->assertStatus(422)
        ->assertJsonPath('code', 'validation_failed');
});

it('validates level bounds and position values', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->patchJson('/api/v1/me', [
        'positions' => ['santrafor'],
        'level' => 9,
        'city_id' => 34,
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('soft deletes and anonymizes the account', function () {
    $User = User::factory()->create(['email' => 'silinecek@example.com']);

    $this->actingAs($User)->deleteJson('/api/v1/me')->assertOk();

    $Trashed = User::withTrashed()->find($User->id);

    expect($Trashed)->not->toBeNull()
        ->and($Trashed->deleted_at)->not->toBeNull()
        ->and($Trashed->email)->toBeNull()
        ->and($Trashed->phone)->toBeNull()
        ->and($Trashed->name)->toBeNull();
});

it('invalidates tokens after account deletion', function () {
    $User = User::factory()->create();
    $Token = $User->createToken('mobile')->plainTextToken;
    $Headers = ['Authorization' => 'Bearer '.$Token];

    $this->deleteJson('/api/v1/me', [], $Headers)->assertOk();

    // Aynı test içindeki ikinci istekte guard'ın kullanıcıyı hatırlamaması için
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/v1/me', $Headers)->assertStatus(401);
});

it('purges users deleted more than 30 days ago', function () {
    $User = User::factory()->create();
    $User->delete();

    User::withTrashed()->findOrFail($User->id)
        ->forceFill(['deleted_at' => now()->subDays(31)])
        ->save();

    $this->artisan('users:purge')->assertSuccessful();

    expect(User::withTrashed()->find($User->id))->toBeNull();
});
