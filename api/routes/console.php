<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// KVKK: 30 günden eski soft-delete hesapları kalıcı sil (spec: 01-auth-profile.md)
Schedule::command('users:purge')->daily();

// Saati geçen maçlar played, süresi dolan ilanlar expired (spec: 03-match-organization.md)
Schedule::command('matches:sweep')->hourly();

// 48 saattir onaylanmamış skorlar otomatik onaylanır (spec: 06-stats-rating.md, karar #1)
Schedule::command('results:auto-confirm')->hourly();
