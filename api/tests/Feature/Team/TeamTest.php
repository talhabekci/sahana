<?php

use App\Models\Team;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('creates a team and makes the creator captain', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/teams', [
        'name' => 'Kartallar FK',
        'badge_icon' => 'shield',
        'color_home' => '#1A4029',
    ])->assertCreated()
        ->assertJsonPath('data.name', 'Kartallar FK')
        ->assertJsonPath('data.my_role', 'captain')
        ->assertJsonPath('data.members_count', 1);
});

it('validates team creation fields', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/teams', [
        'name' => '',
        'badge_icon' => 'not-a-real-icon',
        'color_home' => 'red',
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('lets a team be created with a custom logo instead of a badge icon', function () {
    Storage::fake('public');
    $User = User::factory()->create();

    $Response = $this->actingAs($User)->postJson('/api/v1/teams', [
        'name' => 'Kartallar FK',
        'color_home' => '#123ABC',
        'logo' => UploadedFile::fake()->image('logo.jpg', 200, 200),
    ])->assertCreated();

    expect($Response->json('data.logo_url'))->not->toBeNull();

    $Team = Team::first();
    Storage::disk('public')->assertExists($Team->logo_path);
});

it('requires either a badge icon or a logo when creating a team', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/teams', [
        'name' => 'Kartallar FK',
        'color_home' => '#123ABC',
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('accepts any valid hex color for a team, not just presets', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/teams', [
        'name' => 'Özel Renkli FK',
        'badge_icon' => 'shield',
        'color_home' => '#7A2CF0',
    ])->assertCreated()->assertJsonPath('data.color_home', '#7A2CF0');
});

it('lets the captain update the team logo', function () {
    Storage::fake('public');
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $this->actingAs($Captain)->post('/api/v1/teams/'.$Team->public_id, [
        '_method' => 'PATCH',
        'logo' => UploadedFile::fake()->image('logo.jpg', 200, 200),
    ])->assertOk();

    expect(Team::find($Team->id)->logo_path)->not->toBeNull();
});

it('lists only the teams the user belongs to', function () {
    $User = User::factory()->create();
    $Other = User::factory()->create();

    $MyTeam = Team::factory()->create();
    $MyTeam->members()->attach($User->id, ['role' => 'captain', 'joined_at' => now()]);

    $OtherTeam = Team::factory()->create();
    $OtherTeam->members()->attach($Other->id, ['role' => 'captain', 'joined_at' => now()]);

    $Response = $this->actingAs($User)->getJson('/api/v1/teams')->assertOk();

    expect($Response->json('data'))->toHaveCount(1)
        ->and($Response->json('data.0.id'))->toBe($MyTeam->public_id);
});

it('shows team detail with members for a member', function () {
    $User = User::factory()->create(['name' => 'Kaptan Ali']);
    $Team = Team::factory()->create();
    $Team->members()->attach($User->id, ['role' => 'captain', 'joined_at' => now()]);

    $this->actingAs($User)->getJson('/api/v1/teams/'.$Team->public_id)
        ->assertOk()
        ->assertJsonPath('data.members.0.name', 'Kaptan Ali')
        ->assertJsonPath('data.members.0.role', 'captain');
});

it('lets a non-member view the team profile (public, like a player profile)', function () {
    $Outsider = User::factory()->create();
    $Team = Team::factory()->create(['name' => 'Kartallar FK']);

    $this->actingAs($Outsider)->getJson('/api/v1/teams/'.$Team->public_id)
        ->assertOk()
        ->assertJsonPath('data.name', 'Kartallar FK');
});

it('still forbids non-members from managing team lineups', function () {
    $Outsider = User::factory()->create();
    $Team = Team::factory()->create();

    $this->actingAs($Outsider)->getJson('/api/v1/teams/'.$Team->public_id.'/lineups')
        ->assertStatus(403)
        ->assertJsonPath('code', 'forbidden');
});

it('lets the captain update team info', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create(['name' => 'Eski İsim']);
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $this->actingAs($Captain)->patchJson('/api/v1/teams/'.$Team->public_id, [
        'name' => 'Yeni İsim',
    ])->assertOk()->assertJsonPath('data.name', 'Yeni İsim');
});

it('forbids a regular member from updating team info', function () {
    $Captain = User::factory()->create();
    $Member = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Member)->patchJson('/api/v1/teams/'.$Team->public_id, [
        'name' => 'Değiştirmeye Çalışıyorum',
    ])->assertStatus(403);
});

it('lets the captain delete the team', function () {
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);

    $this->actingAs($Captain)->deleteJson('/api/v1/teams/'.$Team->public_id)->assertOk();

    $this->assertDatabaseMissing('teams', ['id' => $Team->id]);
    $this->assertDatabaseMissing('team_members', ['team_id' => $Team->id]);
});

it('forbids a regular member from deleting the team', function () {
    $Captain = User::factory()->create();
    $Member = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Member)->deleteJson('/api/v1/teams/'.$Team->public_id)->assertStatus(403);

    $this->assertDatabaseHas('teams', ['id' => $Team->id]);
});
