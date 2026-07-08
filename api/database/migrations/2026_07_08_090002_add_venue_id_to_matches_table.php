<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matches', function (Blueprint $Table) {
            // venue_text'in yanında opsiyonel — rehberden seçilirse dolar
            // (spec: 08-venues.md karar #3, geriye dönük kırılma yok).
            $Table->foreignId('venue_id')->nullable()->after('team_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('matches', function (Blueprint $Table) {
            $Table->dropConstrainedForeignId('venue_id');
        });
    }
};
