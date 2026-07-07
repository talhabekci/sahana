<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/** Spec kararı: sessiz saat 00:00-08:00, Europe/Istanbul sabit (v1'de kullanıcı bazlı saat dilimi yok). */
class QuietHours
{
    private const TIMEZONE = 'Europe/Istanbul';

    private const START_HOUR = 0;

    private const END_HOUR = 8;

    public static function isQuietNow(): bool
    {
        $Hour = Carbon::now(self::TIMEZONE)->hour;

        return $Hour >= self::START_HOUR && $Hour < self::END_HOUR;
    }

    /** Şu an sessiz saatteyse ertelenecek 08:00 anını (Europe/Istanbul) döner. */
    public static function nextWindowEnd(): Carbon
    {
        $Now = Carbon::now(self::TIMEZONE);
        $Today8am = $Now->copy()->setTime(self::END_HOUR, 0);

        return $Now->lessThan($Today8am) ? $Today8am : $Today8am->addDay();
    }
}
