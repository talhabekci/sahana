<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('match_participants', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('match_id')->constrained('matches')->cascadeOnDelete();
            $Table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $Table->enum('source', ['team', 'listing'])->default('team');
            $Table->enum('rsvp', ['yes', 'no', 'maybe'])->nullable();
            $Table->timestamp('responded_at')->nullable();

            $Table->unique(['match_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_participants');
    }
};
