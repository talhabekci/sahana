<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_match_stats', function (Blueprint $Table) {
            $Table->id();
            $Table->ulid('public_id')->unique();
            $Table->foreignId('match_id')->constrained('matches')->cascadeOnDelete();
            $Table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $Table->unsignedTinyInteger('goals')->default(0);
            $Table->unsignedTinyInteger('assists')->default(0);
            $Table->boolean('approved')->default(false);
            $Table->foreignId('entered_by')->constrained('users')->cascadeOnDelete();
            $Table->timestamps();

            $Table->unique(['match_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_match_stats');
    }
};
