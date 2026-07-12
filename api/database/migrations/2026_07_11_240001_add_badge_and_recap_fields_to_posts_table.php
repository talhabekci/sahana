<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// BACKLOG #54/#55: rozet kazanma ve haftalık özet otomatik gönderileri.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $Table) {
            $Table->enum('type', [
                'text', 'match_played', 'lineup_shared', 'video_shared',
                'player_listing', 'opponent_listing', 'badge_earned', 'weekly_recap',
            ])->default('text')->change();
            $Table->string('badge_key', 40)->nullable()->after('opponent_listing_id');
            $Table->json('recap_data')->nullable()->after('badge_key');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $Table) {
            $Table->dropColumn(['badge_key', 'recap_data']);
            $Table->enum('type', [
                'text', 'match_played', 'lineup_shared', 'video_shared',
                'player_listing', 'opponent_listing',
            ])->default('text')->change();
        });
    }
};
