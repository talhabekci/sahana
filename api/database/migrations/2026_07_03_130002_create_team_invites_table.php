<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_invites', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $Table->string('code', 12)->unique();
            $Table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $Table->timestamp('expires_at')->nullable();
            $Table->unsignedInteger('max_uses')->nullable();
            $Table->unsignedInteger('uses_count')->default(0);
            $Table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_invites');
    }
};
