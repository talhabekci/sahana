<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// BACKLOG #51: ilçe artık serbest metin değil seçim — statik seed tablosu
// (01-auth-profile.md'deki "ilçe seed listesi seçime dönüşecek" planı).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('districts', function (Blueprint $Table) {
            $Table->id();
            // cities.id plaka kodu (unsignedSmallInteger) — FK tipi eşleşmeli,
            // aksi halde MySQL 8 "incompatible" hatası verir (SQLite'ta bu
            // uyuşmazlık sessizce geçiyordu, testler bu yüzden yakalamamıştı).
            $Table->unsignedSmallInteger('city_id');
            $Table->string('name', 60);
            $Table->foreign('city_id')->references('id')->on('cities')->cascadeOnDelete();
            $Table->unique(['city_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('districts');
    }
};
