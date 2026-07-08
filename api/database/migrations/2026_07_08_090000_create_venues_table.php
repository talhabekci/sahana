<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venues', function (Blueprint $Table) {
            $Table->id();
            $Table->ulid('public_id')->unique();
            $Table->string('name', 150);
            $Table->decimal('lat', 10, 7);
            $Table->decimal('lng', 10, 7);
            $Table->string('address', 255)->nullable();
            $Table->json('photos')->nullable();
            $Table->unsignedSmallInteger('price_min')->nullable();
            $Table->unsignedSmallInteger('price_max')->nullable();
            $Table->json('amenities')->nullable();
            $Table->enum('status', ['seeded', 'verified'])->default('seeded');
            $Table->timestamps();

            $Table->index(['lat', 'lng']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venues');
    }
};
