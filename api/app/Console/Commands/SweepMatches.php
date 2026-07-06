<?php

namespace App\Console\Commands;

use App\Actions\Social\CreateMatchPlayedPost;
use App\Models\FootballMatch;
use App\Models\PlayerListing;
use Illuminate\Console\Command;

class SweepMatches extends Command
{
    protected $signature = 'matches:sweep';

    protected $description = 'Saati geçen onaylı maçları played, süresi dolan ilanları expired yapar';

    public function handle(CreateMatchPlayedPost $CreatePost): int
    {
        $PlayedMatches = FootballMatch::where('status', 'confirmed')
            ->where('starts_at', '<=', now())
            ->get();

        foreach ($PlayedMatches as $Match) {
            $Match->forceFill(['status' => 'played'])->save();
            $CreatePost->handle($Match);
        }

        $ExpiredCount = PlayerListing::where('status', 'open')
            ->where('expires_at', '<=', now())
            ->update(['status' => 'expired']);

        $PlayedCount = $PlayedMatches->count();
        $this->info("{$PlayedCount} maç oynandı olarak işaretlendi, {$ExpiredCount} ilan süresi doldu.");

        return self::SUCCESS;
    }
}
