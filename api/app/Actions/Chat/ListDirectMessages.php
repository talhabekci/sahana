<?php

namespace App\Actions\Chat;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use App\Models\User;

class ListDirectMessages
{
    /**
     * Manuel cursor: bkz. ListMessages (aynı gerekçe — Mongo sürücüsüyle
     * native cursorPaginate() garantili uyumlu değil).
     *
     * @return array{data: array<int, array<string, mixed>>, next_cursor: string|null}
     */
    public function handle(User $Me, User $Other, ?string $Before, int $Limit = 30): array
    {
        $ParticipantIds = [$Me->id, $Other->id];
        sort($ParticipantIds);

        $Query = Message::where('participant_ids', $ParticipantIds)->orderByDesc('id');

        if ($Before !== null) {
            $Query->where('id', '<', $Before);
        }

        $Messages = $Query->limit($Limit + 1)->get();
        $HasMore = $Messages->count() > $Limit;
        $Messages = $Messages->take($Limit);

        $Authors = [$Me->id => $Me, $Other->id => $Other];

        $Data = $Messages
            ->map(fn (Message $Message): array => MessageResource::shape($Message, $Authors[$Message->user_id] ?? null))
            ->values()
            ->all();

        return [
            'data' => $Data,
            'next_cursor' => $HasMore ? (string) $Messages->last()->id : null,
        ];
    }
}
