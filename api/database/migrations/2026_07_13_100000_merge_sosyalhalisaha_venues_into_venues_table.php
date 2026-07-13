<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

// BACKLOG #62: sosyalhalisaha_venues ayrı bir tabloydu, sadece isim/ID
// eşlemesi taşıyordu. Kullanıcı kararı: tekil bir "venues" tablosu +
// type ayrımı (internal|sosyalhalisaha) — ileride kendi eklediğimiz
// halı sahalar da aynı tabloda type=internal olarak durur, kaynak
// başına ayrı tablo açılmaz. matches.venue_id ve
// matches.sosyalhalisaha_venue_id iki ayrı FK olarak kalıyor (kullanıcı
// onayıyla) — ikisi de artık birleşik venues tablosuna işaret ediyor.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('venues', function (Blueprint $Table): void {
            $Table->string('type', 20)->default('internal')->after('public_id');
            $Table->foreignId('district_id')->nullable()->after('type')->constrained()->nullOnDelete();
            $Table->unsignedInteger('external_id')->nullable()->after('district_id');
            $Table->decimal('lat', 10, 7)->nullable()->change();
            $Table->decimal('lng', 10, 7)->nullable()->change();
        });

        Schema::table('venues', function (Blueprint $Table): void {
            $Table->unique(['district_id', 'external_id']);
        });

        // sosyalhalisaha_venue_id'nin eski tabloya olan FK'ını kaldırıyoruz ki
        // aşağıda venues.id'lere yeniden yazarken kısıt hatası almayalım.
        Schema::table('matches', function (Blueprint $Table): void {
            $Table->dropForeign(['sosyalhalisaha_venue_id']);
        });

        DB::table('sosyalhalisaha_venues')->orderBy('id')->each(function (object $Row): void {
            $NewId = DB::table('venues')->insertGetId([
                'public_id' => (string) Str::ulid(),
                'type' => 'sosyalhalisaha',
                'district_id' => $Row->district_id,
                'external_id' => $Row->external_id,
                'name' => $Row->name,
                'status' => 'seeded',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('matches')
                ->where('sosyalhalisaha_venue_id', $Row->id)
                ->update(['sosyalhalisaha_venue_id' => $NewId]);
        });

        Schema::table('matches', function (Blueprint $Table): void {
            $Table->foreign('sosyalhalisaha_venue_id')->references('id')->on('venues')->nullOnDelete();
        });

        Schema::dropIfExists('sosyalhalisaha_venues');
    }

    /**
     * Not: geri alma şema şeklini geri getirir; sosyalhalisaha satırlarının
     * orijinal auto-increment ID'lerini birebir geri yüklemez (bu proje
     * genelinde down() sadece yapısal geri dönüş sağlar).
     */
    public function down(): void
    {
        Schema::create('sosyalhalisaha_venues', function (Blueprint $Table): void {
            $Table->id();
            $Table->foreignId('district_id')->constrained()->cascadeOnDelete();
            $Table->unsignedInteger('external_id');
            $Table->string('name', 150);
            $Table->unique(['district_id', 'external_id']);
        });

        Schema::table('matches', function (Blueprint $Table): void {
            $Table->dropForeign(['sosyalhalisaha_venue_id']);
        });

        DB::table('venues')->where('type', 'sosyalhalisaha')->delete();

        Schema::table('matches', function (Blueprint $Table): void {
            $Table->foreign('sosyalhalisaha_venue_id')->references('id')->on('sosyalhalisaha_venues')->nullOnDelete();
        });

        Schema::table('venues', function (Blueprint $Table): void {
            $Table->dropUnique(['district_id', 'external_id']);
            $Table->dropConstrainedForeignId('district_id');
            $Table->dropColumn(['type', 'external_id']);
            $Table->decimal('lat', 10, 7)->nullable(false)->change();
            $Table->decimal('lng', 10, 7)->nullable(false)->change();
        });
    }
};
