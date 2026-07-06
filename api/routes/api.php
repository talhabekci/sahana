<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BlockController;
use App\Http\Controllers\Api\V1\CityController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\FeedController;
use App\Http\Controllers\Api\V1\FollowController;
use App\Http\Controllers\Api\V1\LineupController;
use App\Http\Controllers\Api\V1\ListingApplicationController;
use App\Http\Controllers\Api\V1\MatchController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\OpponentListingController;
use App\Http\Controllers\Api\V1\PlayerController;
use App\Http\Controllers\Api\V1\PlayerListingController;
use App\Http\Controllers\Api\V1\PostCommentController;
use App\Http\Controllers\Api\V1\PostController;
use App\Http\Controllers\Api\V1\PostLikeController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\TeamController;
use App\Http\Controllers\Api\V1\TeamInviteController;
use App\Http\Controllers\Api\V1\TeamMemberController;
use App\Http\Controllers\Api\V1\VideoController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => response()->json([
        'data' => ['status' => 'ok'],
    ]));

    Route::post('/auth/otp', [AuthController::class, 'otp']);
    Route::post('/auth/verify', [AuthController::class, 'verify']);

    Route::get('/cities', [CityController::class, 'index']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/me', [MeController::class, 'show']);
        Route::patch('/me', [MeController::class, 'update']);
        Route::delete('/me', [MeController::class, 'destroy']);

        // Modül 4: takip/engel durumu için auth zorunlu (spec: 04-social-feed.md).
        Route::get('/players/{PublicId}', [PlayerController::class, 'show']);
        Route::get('/players/{PublicId}/posts', [PlayerController::class, 'posts']);
        Route::post('/players/{PublicId}/follow', [FollowController::class, 'store']);
        Route::delete('/players/{PublicId}/follow', [FollowController::class, 'destroy']);
        Route::post('/players/{PublicId}/block', [BlockController::class, 'store']);
        Route::delete('/players/{PublicId}/block', [BlockController::class, 'destroy']);

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

        Route::get('/matches', [MatchController::class, 'index']);
        Route::post('/matches', [MatchController::class, 'store']);
        Route::get('/matches/{Match}', [MatchController::class, 'show']);
        Route::patch('/matches/{Match}', [MatchController::class, 'update']);
        Route::post('/matches/{Match}/confirm', [MatchController::class, 'confirm']);
        Route::post('/matches/{Match}/cancel', [MatchController::class, 'cancel']);
        Route::put('/matches/{Match}/rsvp', [MatchController::class, 'rsvp']);

        Route::get('/matches/{Match}/videos', [VideoController::class, 'index']);
        Route::post('/matches/{Match}/videos', [VideoController::class, 'store']);
        Route::delete('/videos/{Video}', [VideoController::class, 'destroy']);

        Route::post('/matches/{Match}/listings', [PlayerListingController::class, 'store']);
        Route::get('/listings', [PlayerListingController::class, 'index']);
        Route::get('/listings/{Listing}', [PlayerListingController::class, 'show']);
        Route::post('/listings/{Listing}/applications', [ListingApplicationController::class, 'store']);
        Route::post('/applications/{Application}/approve', [ListingApplicationController::class, 'approve']);
        Route::post('/applications/{Application}/reject', [ListingApplicationController::class, 'reject']);

        Route::post('/opponent-listings', [OpponentListingController::class, 'store']);
        Route::get('/opponent-listings', [OpponentListingController::class, 'index']);
        Route::post('/opponent-listings/{Listing}/match', [OpponentListingController::class, 'matchListing']);

        Route::get('/feed', [FeedController::class, 'index']);

        Route::post('/posts', [PostController::class, 'store']);
        Route::get('/posts/{Post}', [PostController::class, 'show']);
        Route::delete('/posts/{Post}', [PostController::class, 'destroy']);
        Route::post('/posts/{Post}/like', [PostLikeController::class, 'store']);
        Route::delete('/posts/{Post}/like', [PostLikeController::class, 'destroy']);
        Route::get('/posts/{Post}/comments', [PostCommentController::class, 'index']);
        Route::post('/posts/{Post}/comments', [PostCommentController::class, 'store']);
        Route::delete('/comments/{Comment}', [CommentController::class, 'destroy']);

        Route::post('/reports', [ReportController::class, 'store']);
        Route::get('/search', [SearchController::class, 'index']);
    });
});
