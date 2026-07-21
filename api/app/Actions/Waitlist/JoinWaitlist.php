<?php

namespace App\Actions\Waitlist;

use App\Models\WaitlistEntry;

class JoinWaitlist
{
    public function handle(string $Email): WaitlistEntry
    {
        // Aynı e-posta ikinci kez gönderilirse hata değil, var olan kaydı
        // döner — kullanıcıya "zaten kayıtlısın" gibi bir şey sızdırmadan
        // idempotent bir başarı deneyimi.
        return WaitlistEntry::firstOrCreate(['email' => $Email]);
    }
}
