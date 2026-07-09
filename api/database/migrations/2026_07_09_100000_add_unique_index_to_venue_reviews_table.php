<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('venue_reviews', function (Blueprint $Table) {
            // Bulunan hata (2026-07-09): aynı kullanıcı bir sahaya birden
            // fazla yorum yapabiliyordu — kaç farklı maçı olursa olsun
            // en fazla bir yorum (spec: 08-venues.md).
            $Table->unique(['venue_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('venue_reviews', function (Blueprint $Table) {
            $Table->dropUnique(['venue_id', 'user_id']);
        });
    }
};
