<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiError;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function store(StoreReportRequest $Request): JsonResponse
    {
        /** @var User $Reporter */
        $Reporter = $Request->user();

        $SubjectType = $Request->validated('subject_type');
        $SubjectPublicId = $Request->validated('subject_id');

        $SubjectId = match ($SubjectType) {
            'post' => Post::where('public_id', $SubjectPublicId)->firstOrFail()->id,
            'comment' => Comment::where('public_id', $SubjectPublicId)->firstOrFail()->id,
            'user' => User::where('public_id', $SubjectPublicId)->firstOrFail()->id,
            default => throw new ApiError('Geçersiz şikayet türü.', 'validation_failed', 422),
        };

        Report::create([
            'reporter_id' => $Reporter->id,
            'subject_type' => $SubjectType,
            'subject_id' => $SubjectId,
            'reason' => $Request->validated('reason'),
        ]);

        return response()->json(['data' => ['status' => 'reported']], 201);
    }
}
