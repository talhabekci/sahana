<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('match_participants', function (Blueprint $Table) {
            $Table->boolean('attended')->nullable()->after('responded_at');
        });
    }

    public function down(): void
    {
        Schema::table('match_participants', function (Blueprint $Table) {
            $Table->dropColumn('attended');
        });
    }
};
