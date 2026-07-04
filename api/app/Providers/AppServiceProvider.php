<?php

namespace App\Providers;

use App\Models\FootballMatch;
use App\Policies\MatchPolicy;
use App\Services\Sms\LogSmsSender;
use App\Services\Sms\SmsSender;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(SmsSender::class, LogSmsSender::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Model adı FootballMatch (PHP'de `match` ayrılmış sözcük) olduğundan
        // policy otomatik keşfedilmez; elle bağlanır.
        Gate::policy(FootballMatch::class, MatchPolicy::class);
    }
}
