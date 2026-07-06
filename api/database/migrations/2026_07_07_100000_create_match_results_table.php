<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('match_results', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('match_id')->unique()->constrained('matches')->cascadeOnDelete();
            $Table->unsignedTinyInteger('home_score');
            $Table->unsignedTinyInteger('away_score');
            $Table->foreignId('entered_by')->constrained('users')->cascadeOnDelete();
            $Table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $Table->enum('status', ['pending', 'confirmed', 'disputed'])->default('pending');
            $Table->timestamps();

            $Table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('match_results');
    }
};
