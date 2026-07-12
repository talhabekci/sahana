<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// BACKLOG #58: sosyalhalisaha.com'daki saha dizini — video içeriği değil,
// sadece isim/ID eşlemesi (`sosyalhalisaha:sync` komutuyla doldurulur).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sosyalhalisaha_venues', function (Blueprint $Table) {
            $Table->id();
            $Table->foreignId('district_id')->constrained()->cascadeOnDelete();
            $Table->unsignedInteger('external_id');
            $Table->string('name', 150);
            $Table->unique(['district_id', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sosyalhalisaha_venues');
    }
};
