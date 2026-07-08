<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venue_reviews', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('venue_id')->constrained()->cascadeOnDelete();
            $Table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Kanıt bağı: yorumun hangi (oynanmış) maça dayandığı — sahte yorum direnci.
            $Table->foreignId('match_id')->constrained('matches')->cascadeOnDelete();
            $Table->unsignedTinyInteger('score');
            $Table->text('body')->nullable();
            $Table->timestamps();

            $Table->index('venue_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venue_reviews');
    }
};
