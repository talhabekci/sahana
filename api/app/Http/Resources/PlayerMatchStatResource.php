<?php

namespace App\Http\Resources;

use App\Models\PlayerMatchStat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin PlayerMatchStat
 */
class PlayerMatchStatResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        return [
            'id' => $this->public_id,
            'goals' => $this->goals,
            'assists' => $this->assists,
            'approved' => $this->approved,
            'player' => $this->whenLoaded('user', fn (): array => [
                'id' => $this->user->public_id,
                'name' => $this->user->name,
            ]),
        ];
    }
}
