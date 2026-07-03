<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teams', function (Blueprint $Table) {
            $Table->id();
            $Table->ulid('public_id')->unique();
            $Table->string('name', 60);
            // R2 presigned upload akışı (api-conventions §7) henüz kurulmadı;
            // Modül 1'deki avatar kararıyla aynı çizgide: v1'de hazır ikon seti.
            $Table->string('badge_icon', 30)->default('shield');
            $Table->string('color_home', 7);
            $Table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $Table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teams');
    }
};
