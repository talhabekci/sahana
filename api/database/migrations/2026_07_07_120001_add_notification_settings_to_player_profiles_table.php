<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('player_profiles', function (Blueprint $Table) {
            $Table->boolean('quiet_hours_enabled')->default(true)->after('auto_posts_enabled');
            $Table->json('notification_preferences')->nullable()->after('quiet_hours_enabled');
            $Table->timestamp('last_social_summary_at')->nullable()->after('notification_preferences');
        });
    }

    public function down(): void
    {
        Schema::table('player_profiles', function (Blueprint $Table) {
            $Table->dropColumn(['quiet_hours_enabled', 'notification_preferences', 'last_social_summary_at']);
        });
    }
};
