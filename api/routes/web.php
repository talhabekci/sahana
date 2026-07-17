<?php

use App\Http\Controllers\MediaController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('landing');
});

// Yüklenen medya (avatar/arma/foto/video/ses) — Range destekli servis
// (BACKLOG #50). ImageUploader::url() bu route'a işaret eder.
Route::get('/media/{Path}', [MediaController::class, 'show'])
    ->where('Path', '.*')
    ->name('media.show');
