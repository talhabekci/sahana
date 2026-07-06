<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Başka oyunculara görünen herkese açık profil — iletişim bilgisi İÇERMEZ
 * (spec: docs/features/01-auth-profile.md, "herkese açık kısmı").
 *
 * @mixin User
 */
class PlayerPublicResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        $CurrentUser = $Request->user();

        return [
            'id' => $this->public_id,
            'name' => $this->name,
            'avatar_path' => $this->avatar_path,
            'profile' => $this->whenLoaded('profile', fn (): array => [
                'positions' => $this->profile?->positions,
                'foot' => $this->profile?->foot,
                'level' => $this->profile?->level,
                'city' => $this->profile?->city?->name,
                'district' => $this->profile?->district,
                'bio' => $this->profile?->bio,
            ]),
            'followers_count' => $this->followers_count ?? $this->followers()->count(),
            'following_count' => $this->following_count ?? $this->following()->count(),
            'is_following' => $CurrentUser !== null && $CurrentUser->id !== $this->id
                ? $CurrentUser->isFollowing($this->resource)
                : null,
            'is_blocked' => $CurrentUser !== null && $CurrentUser->id !== $this->id
                ? $CurrentUser->hasBlocked($this->resource)
                : null,
        ];
    }
}
