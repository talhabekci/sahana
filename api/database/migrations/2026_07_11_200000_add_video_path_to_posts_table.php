<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// BACKLOG #37: akış gönderisine doğrudan video yükleme. `video_id` maça bağlı
// harici/yüklenmiş videolara (Modül 5) işaret eder; `video_path` ise gönderiye
// doğrudan yüklenen dosyanın public disk yoludur — ikisi ayrı kavramlar.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $Table) {
            $Table->string('video_path')->nullable()->after('image_path');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $Table) {
            $Table->dropColumn('video_path');
        });
    }
};
