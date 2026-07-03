<?php

namespace App\Http\Resources;

use App\Models\TeamInvite;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin TeamInvite
 */
class TeamInviteResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        return [
            'code' => $this->code,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'max_uses' => $this->max_uses,
            'uses_count' => $this->uses_count,
        ];
    }
}
