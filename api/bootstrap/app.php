<?php

use App\Exceptions\ApiError;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // Varsayılan channels: parametresi /broadcasting/auth'u 'web' (session)
    // middleware'iyle kaydeder; mobil Sanctum bearer token kullandığından
    // burada elle auth:sanctum + /api/v1 prefix'iyle kaydediyoruz.
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        attributes: ['prefix' => 'api/v1', 'middleware' => ['auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $Middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $Exceptions): void {
        // api-conventions.md §4 — hata zarfı: {message, code, errors?}
        $Exceptions->render(function (ApiError $Error, Request $Request) {
            return response()->json([
                'message' => $Error->getMessage(),
                'code' => $Error->apiCode(),
            ], $Error->status());
        });

        $Exceptions->render(function (ValidationException $Exception, Request $Request) {
            if ($Request->is('api/*')) {
                return response()->json([
                    'message' => 'Doğrulama hatası.',
                    'code' => 'validation_failed',
                    'errors' => $Exception->errors(),
                ], 422);
            }
        });

        $Exceptions->render(function (AuthenticationException $Exception, Request $Request) {
            if ($Request->is('api/*')) {
                return response()->json([
                    'message' => 'Kimlik doğrulaması gerekli.',
                    'code' => 'unauthenticated',
                ], 401);
            }
        });

        // Laravel, policy authorize() reddini render callback'lerine gelmeden
        // önce AccessDeniedHttpException'a çevirir (Handler::prepareException).
        $Exceptions->render(function (AccessDeniedHttpException $Exception, Request $Request) {
            if ($Request->is('api/*')) {
                return response()->json([
                    'message' => 'Bu işlem için yetkin yok.',
                    'code' => 'forbidden',
                ], 403);
            }
        });

        $Exceptions->render(function (NotFoundHttpException $Exception, Request $Request) {
            if ($Request->is('api/*')) {
                return response()->json([
                    'message' => 'Kaynak bulunamadı.',
                    'code' => 'not_found',
                ], 404);
            }
        });
    })->create();
