<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $Table) {
            $Table->ulid('public_id')->nullable()->unique()->after('id');
            $Table->string('phone', 20)->nullable()->unique()->after('name');
            $Table->string('avatar_path')->nullable()->after('password');
            $Table->softDeletes();

            // OTP ile kayıtta isim/e-posta/şifre henüz yok; onboarding'de dolar.
            $Table->string('name')->nullable()->change();
            $Table->string('email')->nullable()->change();
            $Table->string('password')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $Table) {
            $Table->dropColumn(['public_id', 'phone', 'avatar_path', 'deleted_at']);
        });
    }
};
