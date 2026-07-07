<?php

namespace App\Actions\Chat;

use App\Models\Message;
use App\Models\User;

class ListConversations
{
    /**
     * Takım sohbetleri (üyelik üzerinden) + DM'ler (son mesajlar taranarak
     * kişi bazında indirgenir — v1'de agregasyon pipeline'ı yok, bkz. spec).
     *
     * @return array<int, array<string, mixed>>
     */
    public function handle(User $Me): array
    {
        $Entries = [];

        foreach ($Me->teams as $Team) {
            $Last = Message::where('team_id', $Team->id)->orderByDesc('id')->first();

            $Entries[] = [
                'type' => 'team',
                'id' => $Team->public_id,
                'title' => $Team->name,
                'badge_icon' => $Team->badge_icon,
                'color' => $Team->color_home,
                'last_message' => $Last !== null ? self::preview($Last) : null,
                'last_message_at' => $Last?->created_at?->toIso8601String(),
                'sort_key' => $Last === null ? '' : $Last->id,
            ];
        }

        $DmMessages = Message::where('participant_ids', $Me->id)
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        /** @var array<int, Message> $LatestByOtherId */
        $LatestByOtherId = [];

        foreach ($DmMessages as $DmMessage) {
            $OtherId = collect($DmMessage->participant_ids)->first(fn (int $Id): bool => $Id !== $Me->id);

            if ($OtherId === null || isset($LatestByOtherId[$OtherId])) {
                continue;
            }

            $LatestByOtherId[$OtherId] = $DmMessage;
        }

        $Others = User::whereIn('id', array_keys($LatestByOtherId))->get()->keyBy('id');

        foreach ($LatestByOtherId as $OtherId => $Last) {
            $Other = $Others->get($OtherId);

            if ($Other === null) {
                continue;
            }

            $Entries[] = [
                'type' => 'dm',
                'id' => $Other->public_id,
                'title' => $Other->name,
                'avatar_path' => $Other->avatar_path,
                'last_message' => self::preview($Last),
                'last_message_at' => $Last->created_at->toIso8601String(),
                'sort_key' => $Last->id,
            ];
        }

        // Mongo ObjectId'ler oluşturulma sırasına göre sözlüksel sıralanır
        // (saniye çözünürlüklü ISO string'e göre daha güvenilir — aynı saniye
        // içindeki mesajlar da doğru sıralanır).
        usort($Entries, fn (array $A, array $B): int => $B['sort_key'] <=> $A['sort_key']);

        return array_map(function (array $Entry): array {
            unset($Entry['sort_key']);

            return $Entry;
        }, $Entries);
    }

    private static function preview(Message $Message): string
    {
        return match ($Message->type) {
            'text' => (string) $Message->body,
            'image' => '📷 Fotoğraf',
            'match_ref' => '⚽ Maç paylaşıldı',
            'lineup_ref' => '📋 Kadro paylaşıldı',
            default => '',
        };
    }
}
