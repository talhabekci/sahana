<?php

use App\Models\Post;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('creates a text post', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/posts', [
        'body' => 'Bu akşamki maç harikaydı!',
    ])->assertCreated()
        ->assertJsonPath('data.type', 'text')
        ->assertJsonPath('data.body', 'Bu akşamki maç harikaydı!')
        ->assertJsonPath('data.author.id', $User->public_id);
});

it('lets any team member tag a post to their team', function () {
    $Captain = User::factory()->create();
    $Member = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $this->actingAs($Member)->postJson('/api/v1/posts', [
        'body' => 'Takım olarak harikaydık.',
        'team_id' => $Team->public_id,
    ])->assertCreated()
        ->assertJsonPath('data.team.id', $Team->public_id);
});

it('rejects tagging a team the author is not a member of', function () {
    $User = User::factory()->create();
    $Team = Team::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/posts', [
        'body' => 'Deneme',
        'team_id' => $Team->public_id,
    ])->assertStatus(403);
});

it('rejects a profane post', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/posts', [
        'body' => 'Bu amk berbat bir maçtı',
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('validates required body', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/posts', [])
        ->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('lets the owner delete their post', function () {
    $User = User::factory()->create();
    $Post = Post::factory()->for($User)->create();

    $this->actingAs($User)->deleteJson('/api/v1/posts/'.$Post->public_id)->assertOk();

    $this->assertDatabaseMissing('posts', ['id' => $Post->id]);
});

it('lets the team captain delete a teammates post tagged to the team', function () {
    $Captain = User::factory()->create();
    $Member = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Team->members()->attach($Member->id, ['role' => 'member', 'joined_at' => now()]);

    $Post = Post::factory()->for($Member, 'user')->create(['team_id' => $Team->id]);

    $this->actingAs($Captain)->deleteJson('/api/v1/posts/'.$Post->public_id)->assertOk();
});

it('forbids a stranger from deleting a post', function () {
    $User = User::factory()->create();
    $Stranger = User::factory()->create();
    $Post = Post::factory()->for($User)->create();

    $this->actingAs($Stranger)->deleteJson('/api/v1/posts/'.$Post->public_id)->assertStatus(403);
});

it('lets a user attach a photo to a post', function () {
    Storage::fake('public');
    $User = User::factory()->create();

    $Response = $this->actingAs($User)->postJson('/api/v1/posts', [
        'body' => 'Bugünkü maçtan bir kare.',
        'image' => UploadedFile::fake()->image('photo.jpg', 200, 200),
    ])->assertCreated();

    $ImageUrl = $Response->json('data.image_url');
    expect($ImageUrl)->not->toBeNull();

    $Post = Post::first();
    expect($Post->image_path)->not->toBeNull();
    Storage::disk('public')->assertExists($Post->image_path);
});

it('rejects a corrupt file disguised as an image', function () {
    Storage::fake('public');
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/posts', [
        'body' => 'Deneme',
        'image' => UploadedFile::fake()->create('fake.jpg', 10, 'image/jpeg'),
    ])->assertStatus(422)->assertJsonPath('code', 'invalid_image');
});

it('lets a user attach their own teams lineup to a post', function () {
    $User = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($User->id, ['role' => 'captain', 'joined_at' => now()]);
    $Lineup = $Team->lineups()->create([
        'name' => 'Perşembe Kadrosu',
        'formation' => null,
        'positions' => [],
        'created_by' => $User->id,
    ]);

    $this->actingAs($User)->postJson('/api/v1/posts', [
        'body' => 'Bu haftaki kadromuz',
        'lineup_id' => $Lineup->public_id,
    ])->assertCreated()
        ->assertJsonPath('data.lineup.id', $Lineup->public_id)
        ->assertJsonPath('data.lineup.name', 'Perşembe Kadrosu');
});

it('rejects attaching a lineup from a team the user is not a member of', function () {
    $User = User::factory()->create();
    $Captain = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Captain->id, ['role' => 'captain', 'joined_at' => now()]);
    $Lineup = $Team->lineups()->create([
        'name' => 'Kadro',
        'formation' => null,
        'positions' => [],
        'created_by' => $Captain->id,
    ]);

    $this->actingAs($User)->postJson('/api/v1/posts', [
        'body' => 'Deneme',
        'lineup_id' => $Lineup->public_id,
    ])->assertStatus(403);
});
