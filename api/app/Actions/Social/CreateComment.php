<?php

namespace App\Actions\Social;

use App\Exceptions\ApiError;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Notifications\MentionedNotification;
use App\Notifications\PostCommentedNotification;
use Illuminate\Support\Facades\Notification;

class CreateComment
{
    /** @param  array<int, string>  $MentionedUserIds */
    public function handle(Post $Post, User $Author, string $Body, array $MentionedUserIds = []): Comment
    {
        if ($Post->user->isBlockedWith($Author)) {
            throw new ApiError('Bu gönderiye yorum yapamazsın.', 'forbidden', 403);
        }

        $Comment = Comment::create([
            'post_id' => $Post->id,
            'user_id' => $Author->id,
            'body' => $Body,
        ]);

        if ($Post->user_id !== $Author->id) {
            $Comment->setRelation('user', $Author);
            Notification::send($Post->user, new PostCommentedNotification($Post, $Comment));
        }

        $MentionedIds = array_diff($MentionedUserIds, [$Author->public_id, $Post->user->public_id]);

        if ($MentionedIds !== []) {
            $Mentioned = User::whereIn('public_id', $MentionedIds)->get();

            Notification::send($Mentioned, new MentionedNotification($Post, $Author));
        }

        return $Comment;
    }
}
