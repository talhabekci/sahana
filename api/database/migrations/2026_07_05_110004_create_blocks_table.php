<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blocks', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $Table->foreignId('blocked_user_id')->constrained('users')->cascadeOnDelete();
            $Table->timestamp('created_at')->useCurrent();

            $Table->unique(['user_id', 'blocked_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blocks');
    }
};
