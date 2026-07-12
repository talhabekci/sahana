<?php

namespace App\Console\Commands;

use App\Models\MatchParticipant;
use App\Models\PlayerMatchStat;
use App\Models\PlayerProfile;
use App\Models\PlayerRating;
use App\Models\Post;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;

/**
 * Haftalık performans özeti (BACKLOG #55) — Spotify Wrapped mantığı: son 7
 * günde en az 1 maça katılan her oyuncu için otomatik bir "weekly_recap"
 * gönderisi akışa düşer. Checkpoint deseni `notifications:social-summary`
 * ile aynı (last_weekly_recap_at).
 */
class SendWeeklyRecap extends Command
{
    protected $signature = 'recap:weekly';

    protected $description = 'Haftalık maç/gol/asist/reyting özetini akışa otomatik gönderi olarak paylaşır';

    public function handle(): int
    {
        $Since = now()->subDays(7);

        $Profiles = PlayerProfile::query()
            ->where(function (Builder $Query): void {
                $Query->whereNull('last_weekly_recap_at')
                    ->orWhere('last_weekly_recap_at', '<=', now()->subDays(6));
            })
            ->with('user')
            ->get();

        $Count = 0;

        foreach ($Profiles as $Profile) {
            $User = $Profile->user;

            $MatchIds = MatchParticipant::where('user_id', $User->id)
                ->whereHas('match', fn (Builder $Query) => $Query->where('starts_at', '>=', $Since)->where('starts_at', '<=', now()))
                ->pluck('match_id');

            $Profile->forceFill(['last_weekly_recap_at' => now()])->save();

            if ($MatchIds->isEmpty() || $Profile->auto_posts_enabled === false) {
                continue;
            }

            $Stats = PlayerMatchStat::where('user_id', $User->id)
                ->where('approved', true)
                ->whereIn('match_id', $MatchIds)
                ->selectRaw('COALESCE(SUM(goals), 0) as goals, COALESCE(SUM(assists), 0) as assists')
                ->first();

            $Ratings = PlayerRating::where('ratee_id', $User->id)->whereIn('match_id', $MatchIds)->get();

            Post::create([
                'user_id' => $User->id,
                'type' => 'weekly_recap',
                'recap_data' => [
                    'period_start' => $Since->toDateString(),
                    'period_end' => now()->toDateString(),
                    'matches' => $MatchIds->count(),
                    'goals' => (int) ($Stats->goals ?? 0),
                    'assists' => (int) ($Stats->assists ?? 0),
                    'avg_rating' => $Ratings->isNotEmpty() ? round($Ratings->avg('score'), 1) : null,
                ],
            ]);
            $Count++;
        }

        $this->info("{$Count} haftalık özet gönderisi oluşturuldu.");

        return self::SUCCESS;
    }
}
