<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_listings', function (Blueprint $Table) {
            $Table->id();
            $Table->ulid('public_id')->unique();
            $Table->foreignId('match_id')->constrained('matches')->cascadeOnDelete();
            $Table->json('positions_needed');
            $Table->unsignedTinyInteger('needed_count')->default(1);
            $Table->unsignedTinyInteger('level_min');
            $Table->unsignedTinyInteger('level_max');
            // Spec kararı (2026-07-04): v1'de POINT yerine lat/lng + bileşik indeks.
            $Table->decimal('lat', 10, 7);
            $Table->decimal('lng', 10, 7);
            $Table->enum('status', ['open', 'filled', 'expired'])->default('open');
            $Table->timestamp('expires_at');
            $Table->timestamps();

            $Table->index(['status', 'lat', 'lng']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_listings');
    }
};
