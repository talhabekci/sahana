<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Social\CreateComment;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PostCommentController extends Controller
{
    public function index(Post $Post): AnonymousResourceCollection
    {
        return CommentResource::collection(
            $Post->comments()->with('user')->latest()->limit(50)->get(),
        );
    }

    public function store(StoreCommentRequest $Request, Post $Post, CreateComment $Action): JsonResponse
    {
        /** @var User $Author */
        $Author = $Request->user();

        $Comment = $Action->handle($Post, $Author, $Request->validated('body'));
        $Comment->load('user');

        return (new CommentResource($Comment))->response()->setStatusCode(201);
    }
}
