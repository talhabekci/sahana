<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_members', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $Table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $Table->enum('role', ['captain', 'member'])->default('member');
            $Table->unsignedTinyInteger('jersey_number')->nullable();
            $Table->timestamp('joined_at');

            $Table->unique(['team_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_members');
    }
};
