<?php

namespace App\Actions\Chat;

use App\Events\MessageSent;
use App\Exceptions\ApiError;
use App\Http\Resources\MessageResource;
use App\Models\FootballMatch;
use App\Models\Lineup;
use App\Models\Message;
use App\Models\Team;
use App\Models\User;
use App\Notifications\ChatMessageNotification;
use Illuminate\Support\Facades\Notification;

class SendMessage
{
    /**
     * @param  array{type: string, body?: string|null, image_path?: string|null, audio_path?: string|null, audio_duration?: int|null, match_id?: string|null, lineup_id?: string|null}  $Data
     * @return array<string, mixed>
     */
    public function handle(Team $Team, User $Sender, array $Data): array
    {
        $Type = $Data['type'];

        $MatchId = null;

        if ($Type === 'match_ref') {
            $Match = FootballMatch::where('public_id', $Data['match_id'] ?? null)
                ->where('team_id', $Team->id)
                ->first();

            if ($Match === null) {
                throw new ApiError('Bu maç bu takıma ait değil.', 'not_found', 404);
            }

            $MatchId = $Match->public_id;
        }

        $LineupId = null;

        if ($Type === 'lineup_ref') {
            $Lineup = Lineup::where('public_id', $Data['lineup_id'] ?? null)
                ->where('team_id', $Team->id)
                ->first();

            if ($Lineup === null) {
                throw new ApiError('Bu kadro bu takıma ait değil.', 'not_found', 404);
            }

            $LineupId = $Lineup->public_id;
        }

        $Message = Message::create([
            'team_id' => $Team->id,
            'user_id' => $Sender->id,
            'type' => $Type,
            'body' => $Data['body'] ?? null,
            'image_path' => $Data['image_path'] ?? null,
            'audio_path' => $Data['audio_path'] ?? null,
            'audio_duration' => $Data['audio_duration'] ?? null,
            'match_id' => $MatchId,
            'lineup_id' => $LineupId,
        ]);

        $Payload = MessageResource::shape($Message, $Sender);

        broadcast(new MessageSent("team.{$Team->public_id}", $Payload))->toOthers();

        $Recipients = $Team->members->reject(fn (User $Member): bool => $Member->id === $Sender->id);
        Notification::send($Recipients, new ChatMessageNotification($Team, $Sender, $Message));

        return $Payload;
    }
}
