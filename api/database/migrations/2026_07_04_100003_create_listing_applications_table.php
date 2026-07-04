<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('listing_applications', function (Blueprint $Table) {
            $Table->id();
            $Table->ulid('public_id')->unique();
            $Table->foreignId('listing_id')->constrained('player_listings')->cascadeOnDelete();
            $Table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $Table->string('note', 200)->nullable();
            $Table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $Table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $Table->timestamp('decided_at')->nullable();
            $Table->timestamps();

            $Table->unique(['listing_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listing_applications');
    }
};
