<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_ratings', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('match_id')->constrained('matches')->cascadeOnDelete();
            $Table->foreignId('rater_id')->constrained('users')->cascadeOnDelete();
            $Table->foreignId('ratee_id')->constrained('users')->cascadeOnDelete();
            $Table->unsignedTinyInteger('score');
            $Table->timestamps();

            $Table->unique(['match_id', 'rater_id', 'ratee_id']);
            $Table->index(['ratee_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_ratings');
    }
};
