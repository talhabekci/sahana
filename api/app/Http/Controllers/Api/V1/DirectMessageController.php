<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Chat\ListDirectMessages;
use App\Actions\Chat\SendDirectMessage;
use App\Exceptions\ApiError;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDirectMessageRequest;
use App\Models\User;
use App\Support\ImageUploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DirectMessageController extends Controller
{
    public function index(Request $Request, string $PublicId, ListDirectMessages $Action): JsonResponse
    {
        /** @var User $Me */
        $Me = $Request->user();
        $Other = $this->resolveRecipient($Me, $PublicId);

        $Result = $Action->handle(
            $Me,
            $Other,
            $Request->query('before'),
            (int) $Request->query('limit', 30),
        );

        return response()->json([
            'data' => $Result['data'],
            'meta' => ['next_cursor' => $Result['next_cursor']],
        ]);
    }

    public function store(StoreDirectMessageRequest $Request, string $PublicId, SendDirectMessage $Action): JsonResponse
    {
        /** @var User $Me */
        $Me = $Request->user();
        $Other = $this->resolveRecipient($Me, $PublicId);

        $Data = $Request->validated();

        if ($Request->hasFile('image')) {
            $Data['image_path'] = ImageUploader::store($Request->file('image'), 'chat');
        }

        if ($Request->hasFile('audio')) {
            $Data['audio_path'] = $Request->file('audio')->store('chat-audio', 'public');
            $Data['audio_duration'] = isset($Data['audio_duration']) ? (int) $Data['audio_duration'] : null;
        }

        $Payload = $Action->handle($Me, $Other, $Data);

        return response()->json(['data' => $Payload], 201);
    }

    private function resolveRecipient(User $Me, string $PublicId): User
    {
        $Other = User::where('public_id', $PublicId)->first();

        if ($Other === null || $Me->isBlockedWith($Other)) {
            throw new ApiError('Kullanıcı bulunamadı.', 'not_found', 404);
        }

        return $Other;
    }
}
