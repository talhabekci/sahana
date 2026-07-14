<?php

use App\Support\ImageUploader;
use Illuminate\Support\Facades\Storage;

it('builds a /media/ url when the media disk is the local public disk', function () {
    expect(ImageUploader::url('posts/foo.jpg'))->toBe(url('media/posts/foo.jpg'));
});

it('returns null for a null path regardless of the media disk', function () {
    expect(ImageUploader::url(null))->toBeNull();
});

it('builds the remote disk url directly when the media disk is not public (PRODUCTION-READINESS.md §C)', function () {
    config(['filesystems.media_disk' => 's3']);
    Storage::fake('s3');

    expect(ImageUploader::url('posts/foo.jpg'))->toBe(Storage::disk('s3')->url('posts/foo.jpg'));
});
