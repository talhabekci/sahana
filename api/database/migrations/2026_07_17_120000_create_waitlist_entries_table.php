<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Landing page "İlk erişime katıl" formu — mobil API'nin bir parçası değil,
// sadece pazarlama sayfasının e-posta bekleme listesi (tech-stack.md
// Karar Kaydı 2026-07-17).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waitlist_entries', function (Blueprint $Table) {
            $Table->id();
            $Table->string('email', 255)->unique();
            $Table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waitlist_entries');
    }
};
