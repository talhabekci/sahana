<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// BACKLOG #55: haftalık özet komutunun tekrar çalışmasını önleyen checkpoint —
// notifications:social-summary'deki last_social_summary_at ile aynı desen.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_profiles', function (Blueprint $Table) {
            $Table->timestamp('last_weekly_recap_at')->nullable()->after('last_social_summary_at');
        });
    }

    public function down(): void
    {
        Schema::table('player_profiles', function (Blueprint $Table) {
            $Table->dropColumn('last_weekly_recap_at');
        });
    }
};
