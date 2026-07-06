<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('follows', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('follower_id')->constrained('users')->cascadeOnDelete();
            $Table->foreignId('followed_id')->constrained('users')->cascadeOnDelete();
            $Table->timestamp('created_at')->useCurrent();

            $Table->unique(['follower_id', 'followed_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('follows');
    }
};
