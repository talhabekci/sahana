<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_profiles', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $Table->json('positions');
            $Table->enum('foot', ['L', 'R', 'B'])->nullable();
            $Table->unsignedTinyInteger('level');
            $Table->unsignedSmallInteger('city_id');
            $Table->string('district', 60)->nullable();
            $Table->json('availability')->nullable();
            $Table->string('bio', 160)->nullable();
            $Table->timestamps();

            $Table->foreign('city_id')->references('id')->on('cities');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_profiles');
    }
};
