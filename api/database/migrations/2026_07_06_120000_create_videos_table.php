<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('videos', function (Blueprint $Table) {
            $Table->id();
            $Table->ulid('public_id')->unique();
            $Table->foreignId('match_id')->constrained('matches')->cascadeOnDelete();
            $Table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $Table->enum('type', ['external_link', 'uploaded'])->default('external_link');
            $Table->enum('provider', ['youtube', 'sosyalhalisaha', 'other'])->default('other');
            $Table->string('url', 2048)->nullable();
            $Table->string('storage_path')->nullable(); // v2
            $Table->string('title')->nullable();
            $Table->string('thumbnail_url', 2048)->nullable();
            $Table->timestamp('fetched_at')->nullable();
            $Table->timestamps();

            $Table->index(['match_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
