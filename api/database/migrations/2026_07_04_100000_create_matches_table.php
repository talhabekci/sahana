<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matches', function (Blueprint $Table) {
            $Table->id();
            $Table->ulid('public_id')->unique();
            $Table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $Table->foreignId('opponent_team_id')->nullable()->constrained('teams')->nullOnDelete();
            $Table->string('venue_text', 120);
            $Table->decimal('venue_lat', 10, 7)->nullable();
            $Table->decimal('venue_lng', 10, 7)->nullable();
            $Table->timestamp('starts_at');
            $Table->unsignedTinyInteger('format'); // 5..8 (5v5..8v8)
            $Table->unsignedSmallInteger('price_per_player')->nullable(); // TL
            $Table->enum('status', ['draft', 'confirmed', 'played', 'cancelled'])->default('draft');
            $Table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $Table->timestamps();

            $Table->index('starts_at');
            $Table->index('status');
        });

        // Modül 2'de ertelenen FK (lineups.match_id) artık kurulabilir.
        Schema::table('lineups', function (Blueprint $Table) {
            $Table->foreign('match_id')->references('id')->on('matches')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lineups', function (Blueprint $Table) {
            $Table->dropForeign(['match_id']);
        });

        Schema::dropIfExists('matches');
    }
};
