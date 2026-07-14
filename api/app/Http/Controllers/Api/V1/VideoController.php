<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Video\AddVideoToMatch;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVideoRequest;
use App\Http\Resources\VideoResource;
use App\Models\FootballMatch;
use App\Models\User;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class VideoController extends Controller
{
    public function index(Request $Request, FootballMatch $Match): AnonymousResourceCollection
    {
        $this->authorize('view', $Match);

        return VideoResource::collection(
            $Match->videos()->with('user')->latest()->get(),
        );
    }

    public function store(StoreVideoRequest $Request, FootballMatch $Match, AddVideoToMatch $Action): JsonResponse
    {
        $this->authorize('addVideo', $Match);

        /** @var User $Uploader */
        $Uploader = $Request->user();

        if ($Request->hasFile('video')) {
            $StoragePath = $Request->file('video')->store('match-videos', config('filesystems.media_disk'));
            $Video = $Action->handleUpload($Match, $Uploader, $StoragePath);
        } else {
            $Video = $Action->handle($Match, $Uploader, $Request->validated('url'));
        }

        $Video->load('user');

        return (new VideoResource($Video))->response()->setStatusCode(201);
    }

    public function destroy(Request $Request, Video $Video): JsonResponse
    {
        $this->authorize('delete', $Video);

        if ($Video->storage_path !== null) {
            Storage::disk(config('filesystems.media_disk'))->delete($Video->storage_path);
        }

        $Video->delete();

        return response()->json(['data' => ['status' => 'deleted']]);
    }
}
