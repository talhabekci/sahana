<?php

namespace App\Actions\Chat;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use App\Models\Team;
use App\Models\User;

class ListMessages
{
    /**
     * Manuel cursor: Laravel'in native cursorPaginate()'i MongoDB sürücüsüyle
     * garantili uyumlu değil (spec: 07-notifications-chat.md). Yeniden eskiye
     * sıralı döner; `next_cursor` "daha eskisini getir" için kullanılır.
     *
     * @return array{data: array<int, array<string, mixed>>, next_cursor: string|null}
     */
    public function handle(Team $Team, ?string $Before, int $Limit = 30): array
    {
        $Query = Message::where('team_id', $Team->id)->orderByDesc('id');

        if ($Before !== null) {
            $Query->where('id', '<', $Before);
        }

        $Messages = $Query->limit($Limit + 1)->get();
        $HasMore = $Messages->count() > $Limit;
        $Messages = $Messages->take($Limit);

        $UserIds = $Messages->pluck('user_id')->unique()->values()->all();
        $Authors = User::whereIn('id', $UserIds)->get()->keyBy('id');

        $Data = $Messages
            ->map(fn (Message $Message): array => MessageResource::shape($Message, $Authors->get($Message->user_id)))
            ->values()
            ->all();

        return [
            'data' => $Data,
            'next_cursor' => $HasMore ? (string) $Messages->last()->id : null,
        ];
    }
}
