<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $Table) {
            // id = plaka kodu (1-81), CitySeeder ile sabit veri
            $Table->unsignedSmallInteger('id')->primary();
            $Table->string('name', 40);
            $Table->string('slug', 40)->unique();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cities');
    }
};
