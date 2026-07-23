<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeedbackRequest;
use App\Models\Feedback;
use App\Models\User;
use App\Support\ImageUploader;
use Illuminate\Http\JsonResponse;

class FeedbackController extends Controller
{
    public function store(StoreFeedbackRequest $Request): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();

        $Image = $Request->file('image');

        Feedback::create([
            'user_id' => $User->id,
            'type' => $Request->validated('type'),
            'message' => $Request->validated('message'),
            'image_path' => $Image !== null ? ImageUploader::store($Image, 'feedback') : null,
        ]);

        return response()->json(['data' => ['status' => 'received']], 201);
    }
}
