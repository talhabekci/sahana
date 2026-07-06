<?php

namespace App\Console\Commands;

use App\Models\MatchResult;
use Illuminate\Console\Command;

class AutoConfirmResults extends Command
{
    protected $signature = 'results:auto-confirm';

    protected $description = '48 saattir onaylanmamış/itiraz edilmemiş skorları otomatik onaylar';

    public function handle(): int
    {
        $Count = MatchResult::where('status', 'pending')
            ->where('created_at', '<=', now()->subHours(48))
            ->update(['status' => 'confirmed']);

        $this->info("{$Count} skor otomatik onaylandı.");

        return self::SUCCESS;
    }
}
