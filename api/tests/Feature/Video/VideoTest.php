<?php

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\User;
use App\Models\Video;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

function videoMatchWithParticipant(): array
{
    $Player = User::factory()->create();
    $Team = Team::factory()->create();
    $Team->members()->attach($Player->id, ['role' => 'captain', 'joined_at' => now()]);

    $Match = FootballMatch::factory()->for($Team)->create();
    $Match->participants()->create(['user_id' => $Player->id, 'source' => 'team']);

    return [$Match, $Player];
}

it('lets a participant add a youtube video and fetches oembed metadata', function () {
    Http::fake([
        'https://www.youtube.com/oembed*' => Http::response([
            'title' => 'Perşembe Maçı Golleri',
            'thumbnail_url' => 'https://img.youtube.com/vi/abc/hqdefault.jpg',
        ], 200),
    ]);

    [$Match, $Player] = videoMatchWithParticipant();

    $Response = $this->actingAs($Player)->postJson("/api/v1/matches/{$Match->public_id}/videos", [
        'url' => 'https://www.youtube.com/watch?v=abc',
    ])->assertCreated();

    $Response->assertJsonPath('data.provider', 'youtube')
        ->assertJsonPath('data.title', 'Perşembe Maçı Golleri')
        ->assertJsonPath('data.thumbnail_url', 'https://img.youtube.com/vi/abc/hqdefault.jpg');

    $this->assertDatabaseHas('posts', [
        'type' => 'video_shared',
        'match_id' => $Match->id,
        'team_id' => $Match->team_id,
        'user_id' => $Player->id,
    ]);
});

it('classifies a sosyalhalisaha link by provider without scraping it', function () {
    Http::fake([
        '*' => Http::response('<html><head>'
            .'<meta property="og:title" content="Maç Videosu">'
            .'<meta property="og:image" content="https://sosyalhalisaha.com/thumb.jpg">'
            .'</head></html>', 200),
    ]);

    [$Match, $Player] = videoMatchWithParticipant();

    $this->actingAs($Player)->postJson("/api/v1/matches/{$Match->public_id}/videos", [
        'url' => 'https://sosyalhalisaha.com/video-detay/123',
    ])->assertCreated()
        ->assertJsonPath('data.provider', 'sosyalhalisaha')
        ->assertJsonPath('data.title', 'Maç Videosu');
});

it('rejects video add from a non-participant', function () {
    [$Match] = videoMatchWithParticipant();
    $Outsider = User::factory()->create();

    $this->actingAs($Outsider)->postJson("/api/v1/matches/{$Match->public_id}/videos", [
        'url' => 'https://youtu.be/abc',
    ])->assertStatus(403);
});

it('validates the video url', function () {
    [$Match, $Player] = videoMatchWithParticipant();

    $this->actingAs($Player)->postJson("/api/v1/matches/{$Match->public_id}/videos", [
        'url' => 'bu-bir-url-degil',
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('lets a participant upload their own match video', function () {
    Storage::fake('public');
    [$Match, $Player] = videoMatchWithParticipant();

    $Response = $this->actingAs($Player)->post("/api/v1/matches/{$Match->public_id}/videos", [
        'video' => UploadedFile::fake()->create('gol.mp4', 2048, 'video/mp4'),
        'duration_seconds' => 45,
    ])->assertCreated();

    $Response->assertJsonPath('data.type', 'uploaded');
    expect($Response->json('data.video_url'))->not->toBeNull();

    $Video = Video::where('match_id', $Match->id)->first();
    Storage::disk('public')->assertExists($Video->storage_path);

    $this->assertDatabaseHas('posts', [
        'type' => 'video_shared',
        'match_id' => $Match->id,
        'user_id' => $Player->id,
    ]);
});

it('rejects an oversized video upload', function () {
    Storage::fake('public');
    [$Match, $Player] = videoMatchWithParticipant();

    $this->actingAs($Player)->post("/api/v1/matches/{$Match->public_id}/videos", [
        'video' => UploadedFile::fake()->create('gol.mp4', 70000, 'video/mp4'),
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('rejects a video upload with a disallowed file type', function () {
    Storage::fake('public');
    [$Match, $Player] = videoMatchWithParticipant();

    $this->actingAs($Player)->post("/api/v1/matches/{$Match->public_id}/videos", [
        'video' => UploadedFile::fake()->create('evil.exe', 100, 'application/x-msdownload'),
    ])->assertStatus(422)->assertJsonPath('code', 'validation_failed');
});

it('deletes the stored file when an uploaded video is removed', function () {
    Storage::fake('public');
    [$Match, $Player] = videoMatchWithParticipant();

    $Response = $this->actingAs($Player)->post("/api/v1/matches/{$Match->public_id}/videos", [
        'video' => UploadedFile::fake()->create('gol.mp4', 2048, 'video/mp4'),
    ])->assertCreated();

    $Video = Video::where('match_id', $Match->id)->first();
    Storage::disk('public')->assertExists($Video->storage_path);

    $this->actingAs($Player)->deleteJson("/api/v1/videos/{$Response->json('data.id')}")->assertOk();

    Storage::disk('public')->assertMissing($Video->storage_path);
});

it('skips the auto video_shared post when the uploader disabled auto posts', function () {
    Http::fake(['*' => Http::response('', 200)]);

    [$Match, $Player] = videoMatchWithParticipant();
    $Player->profile()->create([
        'positions' => ['kaleci'],
        'level' => 3,
        'city_id' => 34,
        'auto_posts_enabled' => false,
    ]);

    $this->actingAs($Player)->postJson("/api/v1/matches/{$Match->public_id}/videos", [
        'url' => 'https://youtu.be/abc',
    ])->assertCreated();

    $this->assertDatabaseMissing('posts', ['type' => 'video_shared', 'match_id' => $Match->id]);
});

it('lists videos for a match participant', function () {
    [$Match, $Player] = videoMatchWithParticipant();
    Video::factory()->for($Match, 'match')->for($Player, 'user')->create();

    $this->actingAs($Player)->getJson("/api/v1/matches/{$Match->public_id}/videos")
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('lets the uploader delete their own video', function () {
    [$Match, $Player] = videoMatchWithParticipant();
    $Video = Video::factory()->for($Match, 'match')->for($Player, 'user')->create();

    $this->actingAs($Player)->deleteJson("/api/v1/videos/{$Video->public_id}")->assertOk();

    $this->assertDatabaseMissing('videos', ['id' => $Video->id]);
});

it('lets the team captain delete a video added by another participant', function () {
    [$Match, $Captain] = videoMatchWithParticipant();
    $Teammate = User::factory()->create();
    $Match->team->members()->attach($Teammate->id, ['role' => 'member', 'joined_at' => now()]);
    $Match->participants()->create(['user_id' => $Teammate->id, 'source' => 'team']);

    $Video = Video::factory()->for($Match, 'match')->for($Teammate, 'user')->create();

    $this->actingAs($Captain)->deleteJson("/api/v1/videos/{$Video->public_id}")->assertOk();
});

it('rejects video delete from an unrelated participant', function () {
    [$Match, $Captain] = videoMatchWithParticipant();
    $Teammate = User::factory()->create();
    $Match->team->members()->attach($Teammate->id, ['role' => 'member', 'joined_at' => now()]);
    $Match->participants()->create(['user_id' => $Teammate->id, 'source' => 'team']);

    $Video = Video::factory()->for($Match, 'match')->for($Captain, 'user')->create();

    $this->actingAs($Teammate)->deleteJson("/api/v1/videos/{$Video->public_id}")->assertStatus(403);
});
