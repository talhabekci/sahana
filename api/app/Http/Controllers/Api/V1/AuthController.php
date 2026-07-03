<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Auth\SendOtpCode;
use App\Actions\Auth\VerifyOtpCode;
use App\Exceptions\ApiError;
use App\Http\Controllers\Controller;
use App\Http\Requests\SendOtpRequest;
use App\Http\Requests\VerifyOtpRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function otp(SendOtpRequest $Request, SendOtpCode $Action): JsonResponse
    {
        $Identifier = $Request->validated('identifier');

        // Spec: 3/saat/identifier + 10/saat/IP (SMS maliyet saldırısı önlemi)
        $IdentifierKey = 'otp-id:'.sha1($Identifier);
        $IpKey = 'otp-ip:'.$Request->ip();

        if (RateLimiter::tooManyAttempts($IdentifierKey, 3) || RateLimiter::tooManyAttempts($IpKey, 10)) {
            throw new ApiError('Çok fazla kod isteği. Bir süre sonra tekrar dene.', 'otp_rate_limited', 429);
        }

        RateLimiter::hit($IdentifierKey, 3600);
        RateLimiter::hit($IpKey, 3600);

        $Action->handle($Identifier);

        return response()->json(['data' => ['status' => 'sent']]);
    }

    public function verify(VerifyOtpRequest $Request, VerifyOtpCode $Action): JsonResponse
    {
        $Result = $Action->handle(
            $Request->validated('identifier'),
            $Request->validated('code'),
        );

        $Token = $Result['user']->createToken('mobile')->plainTextToken;

        return response()->json(['data' => [
            'token' => $Token,
            'is_new_user' => $Result['is_new_user'],
        ]]);
    }

    public function logout(Request $Request): JsonResponse
    {
        $AccessToken = $Request->user()?->currentAccessToken();

        if ($AccessToken instanceof PersonalAccessToken) {
            $AccessToken->delete();
        }

        return response()->json(['data' => ['status' => 'logged_out']]);
    }
}
