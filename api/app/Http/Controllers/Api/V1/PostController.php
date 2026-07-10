<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Social\CreatePost;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    private const RELATIONS = ['user.profile', 'team', 'match.opponentTeam', 'lineup.team.members', 'video'];

    public function store(StorePostRequest $Request, CreatePost $Action): JsonResponse
    {
        /** @var User $Author */
        $Author = $Request->user();

        $Post = $Action->handle($Author, $Request->validated());
        $Post->load(self::RELATIONS);

        return (new PostResource($Post))->response()->setStatusCode(201);
    }

    public function show(Post $Post): PostResource
    {
        return new PostResource($Post->load(self::RELATIONS)->loadCount(['likes', 'comments']));
    }

    public function destroy(Request $Request, Post $Post): JsonResponse
    {
        $this->authorize('delete', $Post);

        $Post->delete();

        return response()->json(['data' => ['status' => 'deleted']]);
    }
}
