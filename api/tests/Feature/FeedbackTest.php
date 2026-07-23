<?php

use App\Models\Feedback;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('submits bug feedback', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/feedback', [
        'type' => 'bug',
        'message' => 'Sohbet ekranı bazen donuyor.',
    ])->assertCreated()->assertJsonPath('data.status', 'received');

    $this->assertDatabaseHas('feedback', [
        'user_id' => $User->id,
        'type' => 'bug',
        'message' => 'Sohbet ekranı bazen donuyor.',
    ]);
});

it('submits suggestion feedback', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/feedback', [
        'type' => 'suggestion',
        'message' => 'Karanlık tema daha koyu olabilir.',
    ])->assertCreated();

    $this->assertDatabaseHas('feedback', ['user_id' => $User->id, 'type' => 'suggestion']);
});

it('rejects an unauthenticated request', function () {
    $this->postJson('/api/v1/feedback', ['type' => 'bug', 'message' => 'test'])
        ->assertStatus(401);
});

it('rejects an invalid type', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/feedback', [
        'type' => 'invalid',
        'message' => 'test',
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('rejects an empty message', function () {
    $User = User::factory()->create();

    $this->actingAs($User)->postJson('/api/v1/feedback', ['type' => 'bug', 'message' => ''])
        ->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('attaches a screenshot to a bug report (re-encoded/stripped via ImageUploader)', function () {
    Storage::fake('public');
    $User = User::factory()->create();

    $this->actingAs($User)->post('/api/v1/feedback', [
        'type' => 'bug',
        'message' => 'Sohbet ekranı bazen donuyor.',
        'image' => UploadedFile::fake()->image('ss.jpg', 400, 800),
    ])->assertCreated();

    $Feedback = Feedback::where('user_id', $User->id)->firstOrFail();

    expect($Feedback->image_path)->not->toBeNull();
    Storage::disk('public')->assertExists($Feedback->image_path);
});
