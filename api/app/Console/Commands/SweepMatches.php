<?php

namespace App\Console\Commands;

use App\Models\FootballMatch;
use App\Models\PlayerListing;
use Illuminate\Console\Command;

class SweepMatches extends Command
{
    protected $signature = 'matches:sweep';

    protected $description = 'Saati geçen onaylı maçları played, süresi dolan ilanları expired yapar';

    public function handle(): int
    {
        $PlayedCount = FootballMatch::where('status', 'confirmed')
            ->where('starts_at', '<=', now())
            ->update(['status' => 'played']);

        $ExpiredCount = PlayerListing::where('status', 'open')
            ->where('expires_at', '<=', now())
            ->update(['status' => 'expired']);

        $this->info("{$PlayedCount} maç oynandı olarak işaretlendi, {$ExpiredCount} ilan süresi doldu.");

        return self::SUCCESS;
    }
}
