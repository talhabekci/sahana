<?php

use App\Http\Controllers\MediaController;
use App\Http\Controllers\WaitlistController;
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
