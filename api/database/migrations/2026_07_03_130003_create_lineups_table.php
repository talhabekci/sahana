<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lineups', function (Blueprint $Table) {
            $Table->id();
            $Table->ulid('public_id')->unique();
            $Table->foreignId('team_id')->constrained()->cascadeOnDelete();
            // Modül 3 (maçlar) henüz yok; FK constraint'i o migration eklenince kurulacak.
            $Table->unsignedBigInteger('match_id')->nullable();
            $Table->string('name', 60);
            $Table->string('formation', 20)->nullable();
            $Table->json('positions');
            $Table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $Table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lineups');
    }
};
