<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CityController;
use App\Http\Controllers\Api\V1\LineupController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\PlayerController;
use App\Http\Controllers\Api\V1\TeamController;
use App\Http\Controllers\Api\V1\TeamInviteController;
use App\Http\Controllers\Api\V1\TeamMemberController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json([
        'data' => ['status' => 'ok'],
    ]));

    Route::post('/auth/otp', [AuthController::class, 'otp']);
    Route::post('/auth/verify', [AuthController::class, 'verify']);

    Route::get('/players/{PublicId}', [PlayerController::class, 'show']);
    Route::get('/cities', [CityController::class, 'index']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/me', [MeController::class, 'show']);
        Route::patch('/me', [MeController::class, 'update']);
        Route::delete('/me', [MeController::class, 'destroy']);

        Route::get('/teams', [TeamController::class, 'index']);
        Route::post('/teams', [TeamController::class, 'store']);
        Route::get('/teams/{Team}', [TeamController::class, 'show']);
        Route::patch('/teams/{Team}', [TeamController::class, 'update']);

        Route::post('/teams/{Team}/invites', [TeamInviteController::class, 'store']);
        Route::post('/invites/{Code}/accept', [TeamInviteController::class, 'accept']);

        Route::delete('/teams/{Team}/members/{UserPublicId}', [TeamMemberController::class, 'destroy']);
        Route::post('/teams/{Team}/transfer-captaincy', [TeamMemberController::class, 'transferCaptaincy']);

        Route::get('/teams/{Team}/lineups', [LineupController::class, 'index']);
        Route::post('/teams/{Team}/lineups', [LineupController::class, 'store']);
        Route::get('/lineups/{Lineup}', [LineupController::class, 'show']);
        Route::patch('/lineups/{Lineup}', [LineupController::class, 'update']);
    });
});
