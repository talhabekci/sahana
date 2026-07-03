<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json([
        'data' => ['status' => 'ok'],
    ]));

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', fn (Request $Request) => response()->json([
            'data' => $Request->user(),
        ]));
    });
});
