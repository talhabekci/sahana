<?php

namespace App\Actions\Social;

use App\Exceptions\ApiError;
use App\Models\Lineup;
use App\Models\Post;
use App\Models\Team;
use App\Models\User;
use App\Notifications\MentionedNotification;
use App\Support\ImageUploader;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;

class CreatePost
{
    /**
     * @param  array{body: string, team_id?: string|null, image?: UploadedFile|null, video?: UploadedFile|null, lineup_id?: string|null, mentioned_user_ids?: array<int, string>}  $Data
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

        $LineupId = null;

        if (! empty($Data['lineup_id'])) {
            $Lineup = Lineup::where('public_id', $Data['lineup_id'])->firstOrFail();

            if (! $Lineup->team->isMember($Author)) {
                throw new ApiError('Bu kadroyu paylaşamazsın.', 'forbidden', 403);
            }

            $LineupId = $Lineup->id;
        }

        $ImagePath = null;

        if (! empty($Data['image'])) {
            $ImagePath = ImageUploader::store($Data['image'], 'posts');
        }

        $VideoPath = null;

        if (! empty($Data['video'])) {
            $VideoPath = $Data['video']->store('post-videos', config('filesystems.media_disk'));
        }

        $Post = Post::create([
            'user_id' => $Author->id,
            'team_id' => $TeamId,
            'type' => 'text',
            'body' => $Data['body'],
            'image_path' => $ImagePath,
            'video_path' => $VideoPath,
            'lineup_id' => $LineupId,
        ]);

        $MentionedIds = array_diff($Data['mentioned_user_ids'] ?? [], [$Author->public_id]);

        if ($MentionedIds !== []) {
            $Mentioned = User::whereIn('public_id', $MentionedIds)->get();

            Notification::send($Mentioned, new MentionedNotification($Post, $Author));
        }

        return $Post;
    }
}
