<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// BACKLOG #58 (spec: 05-videos.md v1.5) — "Videonu bul" deep-link'i için
// opsiyonel saha eşleşmesi.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matches', function (Blueprint $Table) {
            $Table->foreignId('sosyalhalisaha_venue_id')->nullable()->after('venue_id')
                ->constrained('sosyalhalisaha_venues')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('matches', function (Blueprint $Table) {
            $Table->dropConstrainedForeignId('sosyalhalisaha_venue_id');
        });
    }
};
