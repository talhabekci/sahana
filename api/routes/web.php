<?php

use App\Http\Controllers\MediaController;
use App\Http\Controllers\WaitlistController;
use App\Models\TeamInvite;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    App::setLocale('tr');

    return view('landing');
})->name('landing.tr');

Route::get('/en', function () {
    App::setLocale('en');

    return view('landing');
})->name('landing.en');

Route::post('/waitlist', [WaitlistController::class, 'store'])
    ->middleware('throttle:waitlist')
    ->name('waitlist.store');

// Yüklenen medya (avatar/arma/foto/video/ses) — Range destekli servis
// (BACKLOG #50). ImageUploader::url() bu route'a işaret eder.
Route::get('/media/{Path}', [MediaController::class, 'show'])
    ->where('Path', '.*')
    ->name('media.show');

// Takım daveti — Universal Links/App Links (BACKLOG #81) doğru
// kurulduysa uygulama yüklüyken bu sayfa hiç render edilmez (iOS/Android
// isteği doğrudan uygulamaya yönlendirir); buraya sadece uygulama yüklü
// DEĞİLKEN düşülür. User-Agent'a göre ilgili mağazaya otomatik yönlendirir.
Route::get('/join/{Code}', function (string $Code) {
    App::setLocale('tr');

    $Invite = TeamInvite::where('code', $Code)->with('team')->first();
    $UserAgent = request()->userAgent() ?? '';

    if (preg_match('/iPhone|iPad|iPod/i', $UserAgent) === 1) {
        // TODO: Gerçek App Store URL'i yayınlanınca güncellenmeli.
        return redirect('https://apps.apple.com/app/idXXXXXXXXXX');
    }

    if (preg_match('/Android/i', $UserAgent) === 1) {
        // TODO: Gerçek Play Store URL'i yayınlanınca güncellenmeli.
        return redirect('https://play.google.com/store/apps/details?id=com.sahanaapp.app');
    }

    // Masaüstü/bilinmeyen — otomatik yönlendirme anlamsız, buton göster.
    return view('join', ['team' => $Invite?->team]);
})->name('join.fallback');

// iOS Universal Links doğrulaması (BACKLOG #81) — Apple bu dosyayı
// yönlendirmesiz, tercihen application/json Content-Type ile bekliyor.
Route::get('/.well-known/apple-app-site-association', function () {
    return response()->json([
        'applinks' => [
            'apps' => [],
            'details' => [
                [
                    'appID' => 'YA2SQ3GQD8.com.sahanaapp.app',
                    'paths' => ['/join/*'],
                ],
            ],
        ],
    ]);
});

// Android App Links doğrulaması (BACKLOG #81) — imza SHA-256
// fingerprint'i henüz yok (ilk signed build/Play Console upload'undan
// sonra doldurulmalı), şimdilik placeholder.
Route::get('/.well-known/assetlinks.json', function () {
    return response()->json([
        [
            'relation' => ['delegate_permission/common.handle_all_urls'],
            'target' => [
                'namespace' => 'android_app',
                'package_name' => 'com.sahanaapp.app',
                // TODO: gerçek imza SHA-256 fingerprint'i ile değiştirilmeli.
                'sha256_cert_fingerprints' => ['REPLACE_WITH_REAL_SHA256_FINGERPRINT'],
            ],
        ],
    ]);
});
