<?php

namespace App\Actions\Auth;

use App\Exceptions\ApiError;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class VerifyOtpCode
{
    public const MAX_ATTEMPTS = 5;

    /**
     * @return array{user: User, is_new_user: bool}
     */
    public function handle(string $Identifier, string $Code): array
    {
        $Key = SendOtpCode::cacheKey($Identifier);

        /** @var array{hash: string, attempts: int}|null $Entry */
        $Entry = Cache::get($Key);

        if ($Entry === null) {
            throw new ApiError('Kodun süresi dolmuş, yeni kod iste.', 'otp_expired');
        }

        if (! Hash::check($Code, $Entry['hash'])) {
            $Entry['attempts']++;

            if ($Entry['attempts'] >= self::MAX_ATTEMPTS) {
                Cache::forget($Key);

                throw new ApiError('Çok fazla yanlış deneme. Yeni kod iste.', 'otp_locked', 429);
            }

            Cache::put($Key, $Entry, SendOtpCode::TTL_SECONDS);

            throw new ApiError('Kod hatalı.', 'otp_invalid');
        }

        Cache::forget($Key);

        $Field = str_contains($Identifier, '@') ? 'email' : 'phone';
        $User = User::where($Field, $Identifier)->first();
        $IsNewUser = $User === null;

        $User ??= User::create([$Field => $Identifier]);

        return ['user' => $User, 'is_new_user' => $IsNewUser];
    }
}
