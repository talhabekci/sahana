<?php

namespace App\Actions\Social;

use App\Exceptions\ApiError;
use App\Models\Post;
use App\Models\Team;
use App\Models\User;

class CreatePost
{
    /**
     * @param  array{body: string, team_id?: string|null}  $Data
     */
    public function handle(User $Author, array $Data): Post
    {
        $TeamId = null;

        if (! empty($Data['team_id'])) {
            $Team = Team::where('public_id', $Data['team_id'])->firstOrFail();

            if (! $Team->isMember($Author)) {
                throw new ApiError('Bu takım adına paylaşım yapamazsın.', 'forbidden', 403);
            }

            $TeamId = $Team->id;
        }

        return Post::create([
            'user_id' => $Author->id,
            'team_id' => $TeamId,
            'type' => 'text',
            'body' => $Data['body'],
        ]);
    }
}
