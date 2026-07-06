<?php

namespace App\Actions\Social;

use App\Exceptions\ApiError;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;

class CreateComment
{
    public function handle(Post $Post, User $Author, string $Body): Comment
    {
        if ($Post->user->isBlockedWith($Author)) {
            throw new ApiError('Bu gönderiye yorum yapamazsın.', 'forbidden', 403);
        }

        return Comment::create([
            'post_id' => $Post->id,
            'user_id' => $Author->id,
            'body' => $Body,
        ]);
    }
}
