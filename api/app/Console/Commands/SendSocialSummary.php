<?php

namespace App\Console\Commands;

use App\Models\Comment;
use App\Models\Follow;
use App\Models\Like;
use App\Models\PlayerProfile;
use App\Notifications\SocialSummaryNotification;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;

class SendSocialSummary extends Command
{
    protected $signature = 'notifications:social-summary';

    protected $description = 'Beğeni/yorum/takip birikimini birkaç saatte bir toplu bildirim olarak gönderir';

    public function handle(): int
    {
        $Profiles = PlayerProfile::query()
            ->where(function (Builder $Query): void {
                $Query->whereNull('last_social_summary_at')
                    ->orWhere('last_social_summary_at', '<=', now()->subHours(3));
            })
            ->with('user')
            ->get();

        $Count = 0;

        foreach ($Profiles as $Profile) {
            $Since = $Profile->last_social_summary_at ?? now()->subDays(30);
            $User = $Profile->user;

            $LikesCount = Like::whereHas('post', fn (Builder $Query) => $Query->where('user_id', $User->id))
                ->where('created_at', '>', $Since)
                ->count();
            $CommentsCount = Comment::whereHas('post', fn (Builder $Query) => $Query->where('user_id', $User->id))
                ->where('created_at', '>', $Since)
                ->count();
            $NewFollowersCount = Follow::where('followed_id', $User->id)
                ->where('created_at', '>', $Since)
                ->count();

            $Profile->forceFill(['last_social_summary_at' => now()])->save();

            if ($LikesCount + $CommentsCount + $NewFollowersCount === 0) {
                continue;
            }

            $User->notify(new SocialSummaryNotification($LikesCount, $CommentsCount, $NewFollowersCount));
            $Count++;
        }

        $this->info("{$Count} sosyal özet bildirimi gönderildi.");

        return self::SUCCESS;
    }
}
