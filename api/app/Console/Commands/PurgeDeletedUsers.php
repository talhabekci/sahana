<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PurgeDeletedUsers extends Command
{
    protected $signature = 'users:purge';

    protected $description = 'KVKK: 30 günden eski soft-delete kullanıcıları kalıcı olarak siler';

    public function handle(): int
    {
        $Count = 0;

        User::onlyTrashed()
            ->where('deleted_at', '<=', now()->subDays(30))
            ->each(function (User $User) use (&$Count): void {
                $User->forceDelete();
                $Count++;
            });

        $this->info("{$Count} kullanıcı kalıcı olarak silindi.");

        return self::SUCCESS;
    }
}
