<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Kimliği doğrulanmış kullanıcının kendi profili (tüm alanlar).
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        return [
            'id' => $this->public_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_path' => $this->avatar_path,
            'profile' => $this->whenLoaded('profile', fn (): array => [
                'positions' => $this->profile?->positions,
                'foot' => $this->profile?->foot,
                'level' => $this->profile?->level,
                'city_id' => $this->profile?->city_id,
                'city' => $this->profile?->city?->name,
                'district' => $this->profile?->district,
                'availability' => $this->profile?->availability,
                'bio' => $this->profile?->bio,
            ]),
            'followers_count' => $this->followers_count ?? $this->followers()->count(),
            'following_count' => $this->following_count ?? $this->following()->count(),
        ];
    }
}
