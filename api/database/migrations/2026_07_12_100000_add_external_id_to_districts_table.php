<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// BACKLOG #58: sosyalhalisaha.com'un kendi ilçe ID'si — `sosyalhalisaha:sync`
// komutuyla isim eşleşmesi yapılıp doldurulur.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('districts', function (Blueprint $Table) {
            $Table->unsignedInteger('external_id')->nullable()->after('name')->index();
        });
    }

    public function down(): void
    {
        Schema::table('districts', function (Blueprint $Table) {
            $Table->dropColumn('external_id');
        });
    }
};
