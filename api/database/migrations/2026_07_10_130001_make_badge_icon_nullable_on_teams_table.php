<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $Table) {
            // Artık kullanıcı ikon yerine kendi arma fotoğrafını (logo_path)
            // yükleyebiliyor — bu durumda badge_icon gerçekten boş olabilir
            // (bkz. BACKLOG.md #30).
            $Table->string('badge_icon', 30)->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $Table) {
            $Table->string('badge_icon', 30)->default('shield')->change();
        });
    }
};
