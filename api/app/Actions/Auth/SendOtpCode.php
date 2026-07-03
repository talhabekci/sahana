<?php

namespace App\Actions\Auth;

use App\Mail\OtpCodeMail;
use App\Services\Sms\SmsSender;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class SendOtpCode
{
    public const TTL_SECONDS = 120;

    public function __construct(private readonly SmsSender $Sms) {}

    public function handle(string $Identifier): void
    {
        $Code = (string) random_int(100000, 999999);

        Cache::put(
            self::cacheKey($Identifier),
            ['hash' => Hash::make($Code), 'attempts' => 0],
            self::TTL_SECONDS,
        );

        if (str_contains($Identifier, '@')) {
            Mail::to($Identifier)->queue(new OtpCodeMail($Code));

            return;
        }

        $this->Sms->send($Identifier, "Sahana doğrulama kodun: {$Code}");
    }

    public static function cacheKey(string $Identifier): string
    {
        return 'otp:'.sha1(mb_strtolower($Identifier));
    }
}
