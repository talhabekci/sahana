<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// BACKLOG #54: rozet (başarım) sistemi — katalog PHP'de sabit (BadgeCatalog),
// bu tablo sadece kimin hangi rozeti ne zaman kazandığını tutar.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_badges', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $Table->string('badge_key', 40);
            $Table->timestamp('earned_at');
            $Table->unique(['user_id', 'badge_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_badges');
    }
};
