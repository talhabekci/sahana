<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Chat\ListMessages;
use App\Actions\Chat\SendMessage;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMessageRequest;
use App\Models\Team;
use App\Models\User;
use App\Support\ImageUploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamMessageController extends Controller
{
    public function index(Request $Request, Team $Team, ListMessages $Action): JsonResponse
    {
        $this->authorize('view', $Team);

        $Result = $Action->handle(
            $Team,
            $Request->query('before'),
            (int) $Request->query('limit', 30),
        );

        return response()->json([
            'data' => $Result['data'],
            'meta' => ['next_cursor' => $Result['next_cursor']],
        ]);
    }

    public function store(StoreMessageRequest $Request, Team $Team, SendMessage $Action): JsonResponse
    {
        $this->authorize('view', $Team);

        /** @var User $Sender */
        $Sender = $Request->user();

        $Data = $Request->validated();

        if ($Request->hasFile('image')) {
            $Data['image_path'] = ImageUploader::store($Request->file('image'), 'chat');
        }

        if ($Request->hasFile('audio')) {
            $Data['audio_path'] = $Request->file('audio')->store('chat-audio', 'public');
            $Data['audio_duration'] = isset($Data['audio_duration']) ? (int) $Data['audio_duration'] : null;
        }

        $Payload = $Action->handle($Team, $Sender, $Data);

        return response()->json(['data' => $Payload], 201);
    }
}
