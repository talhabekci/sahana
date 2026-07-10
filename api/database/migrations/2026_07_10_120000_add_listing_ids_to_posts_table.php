<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $Table) {
            $Table->enum('type', [
                'text', 'match_played', 'lineup_shared', 'video_shared',
                'player_listing', 'opponent_listing',
            ])->default('text')->change();
            $Table->foreignId('player_listing_id')->nullable()->after('video_id')
                ->constrained('player_listings')->nullOnDelete();
            $Table->foreignId('opponent_listing_id')->nullable()->after('player_listing_id')
                ->constrained('opponent_listings')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $Table) {
            $Table->dropConstrainedForeignId('player_listing_id');
            $Table->dropConstrainedForeignId('opponent_listing_id');
            $Table->enum('type', ['text', 'match_played', 'lineup_shared', 'video_shared'])
                ->default('text')
                ->change();
        });
    }
};
