<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $Table) {
            $Table->id();
            $Table->ulid('public_id')->unique();
            $Table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $Table->foreignId('team_id')->nullable()->constrained()->nullOnDelete();
            $Table->enum('type', ['text', 'match_played', 'lineup_shared'])->default('text');
            $Table->text('body')->nullable();
            // Genel polimorfik yerine doğrudan FK (sadece 2 olası kaynak var).
            $Table->foreignId('match_id')->nullable()->constrained('matches')->nullOnDelete();
            $Table->foreignId('lineup_id')->nullable()->constrained('lineups')->nullOnDelete();
            $Table->timestamps();

            $Table->index(['team_id', 'created_at']);
            $Table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
