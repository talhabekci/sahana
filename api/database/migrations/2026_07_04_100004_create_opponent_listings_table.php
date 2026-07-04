<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opponent_listings', function (Blueprint $Table) {
            $Table->id();
            $Table->ulid('public_id')->unique();
            $Table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $Table->foreignId('match_id')->nullable()->constrained('matches')->nullOnDelete();
            $Table->string('note', 200)->nullable();
            $Table->decimal('lat', 10, 7)->nullable();
            $Table->decimal('lng', 10, 7)->nullable();
            $Table->enum('status', ['open', 'matched', 'expired'])->default('open');
            $Table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $Table->timestamps();

            $Table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opponent_listings');
    }
};
