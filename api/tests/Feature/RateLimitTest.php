<?php

use App\Models\Post;
use App\Models\User;

it('throttles a write endpoint after the per-minute limit is exceeded (PRODUCTION-READINESS.md §D)', function () {
    $User = User::factory()->create();
    $Post = Post::factory()->create();

    foreach (range(1, 20) as $Attempt) {
        $this->actingAs($User)->postJson("/api/v1/posts/{$Post->public_id}/comments", [
            'body' => "Yorum {$Attempt}",
        ])->assertCreated();
    }

    $this->actingAs($User)->postJson("/api/v1/posts/{$Post->public_id}/comments", [
        'body' => 'Yorum 21',
    ])->assertStatus(429);
});
