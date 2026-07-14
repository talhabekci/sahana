<?php

use Illuminate\Support\Facades\Storage;

it('serves a stored media file', function () {
    Storage::fake('public');
    Storage::disk('public')->put('post-videos/clip.mp4', 'abcdefghij');

    $this->get('/media/post-videos/clip.mp4')
        ->assertOk()
        ->assertHeader('Accept-Ranges', 'bytes');
});

it('honors http range requests with 206 partial content', function () {
    Storage::fake('public');
    Storage::disk('public')->put('chat-audio/voice.m4a', 'abcdefghij');

    $Response = $this->get('/media/chat-audio/voice.m4a', ['Range' => 'bytes=0-3']);

    $Response->assertStatus(206)
        ->assertHeader('Content-Range', 'bytes 0-3/10');

    expect($Response->streamedContent())->toBe('abcd');
});

it('rejects path traversal attempts', function () {
    Storage::fake('public');

    $this->get('/media/..%2F..%2F.env')->assertNotFound();
});

it('returns 404 for missing files', function () {
    Storage::fake('public');

    $this->get('/media/posts/yok.jpg')->assertNotFound();
});

it('404s instead of crashing when MEDIA_DISK is not public (PRODUCTION-READINESS.md §C)', function () {
    config(['filesystems.media_disk' => 's3']);
    Storage::fake('public');
    Storage::disk('public')->put('post-videos/clip.mp4', 'abcdefghij');

    $this->get('/media/post-videos/clip.mp4')->assertNotFound();
});
