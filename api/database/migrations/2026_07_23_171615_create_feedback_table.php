<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $Table->enum('type', ['bug', 'suggestion']);
            $Table->string('message', 2000);
            $Table->enum('status', ['pending', 'reviewed'])->default('pending');
            $Table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
