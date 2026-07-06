<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $Table->enum('subject_type', ['post', 'comment', 'user']);
            $Table->unsignedBigInteger('subject_id');
            $Table->string('reason', 300);
            $Table->enum('status', ['pending', 'reviewed'])->default('pending');
            $Table->timestamps();

            $Table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
