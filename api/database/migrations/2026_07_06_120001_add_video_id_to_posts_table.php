<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $Table) {
            $Table->enum('type', ['text', 'match_played', 'lineup_shared', 'video_shared'])
                ->default('text')
                ->change();
            $Table->foreignId('video_id')->nullable()->after('lineup_id')->constrained('videos')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $Table) {
            $Table->dropConstrainedForeignId('video_id');
            $Table->enum('type', ['text', 'match_played', 'lineup_shared'])->default('text')->change();
        });
    }
};
