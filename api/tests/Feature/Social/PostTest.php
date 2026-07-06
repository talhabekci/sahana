<?php

use App\Models\Post;
use App\Models\Team;
use App\Models\User;

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
