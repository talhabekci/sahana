<?php

namespace App\Providers;

use App\Models\FootballMatch;
use App\Policies\MatchPolicy;
use App\Services\Sms\LogSmsSender;
use App\Services\Sms\SmsSender;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
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

        // PRODUCTION-READINESS.md §D — genel API varsayılan throttle'ı +
        // spam/abuse riski yüksek yazma endpoint'leri (yorum, mesaj, ilan
        // başvurusu) için daha sıkı bir limit. OTP endpoint'leri kendi özel
        // RateLimiter mantığına sahip (AuthController), bunlardan etkilenmez.
        RateLimiter::for('api', function (Request $Request) {
            return Limit::perMinute(60)->by(self::rateLimitKey($Request));
        });

        RateLimiter::for('write', function (Request $Request) {
            return Limit::perMinute(20)->by(self::rateLimitKey($Request));
        });
    }

    /**
     * Girişli istekte kullanıcı ID'sine, misafirde IP'ye göre limit anahtarı.
     */
    private static function rateLimitKey(Request $Request): string
    {
        $User = $Request->user();

        return $User !== null ? (string) $User->id : ($Request->ip() ?? 'unknown');
    }
}
