<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Support\ImageUploader;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class TeamMemberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        return [
            'id' => $this->public_id,
            'name' => $this->name,
            'avatar_path' => ImageUploader::url($this->avatar_path),
            'role' => $this->pivot->role,
            'jersey_number' => $this->pivot->jersey_number,
            'joined_at' => $this->pivot->joined_at->toIso8601String(),
        ];
    }
}
