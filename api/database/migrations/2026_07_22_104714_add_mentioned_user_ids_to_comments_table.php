<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            // Etiketlenen kullanıcıların public_id listesi (BACKLOG #82) —
            // yorumu sonradan görüntülerken "@Ad Soyad" metnini doğru
            // kullanıcıya bağlayabilmek için (isim eşleştirmesi güvenilir
            // değil, aynı isimde birden fazla kullanıcı olabilir).
            $table->json('mentioned_user_ids')->nullable()->after('body');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn('mentioned_user_ids');
        });
    }
};
