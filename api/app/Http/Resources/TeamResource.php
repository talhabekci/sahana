<?php

namespace App\Http\Resources;

use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin Team
 */
class TeamResource extends JsonResource
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
            'badge_icon' => $this->badge_icon,
            'logo_url' => $this->logo_path !== null ? Storage::disk('public')->url($this->logo_path) : null,
            'color_home' => $this->color_home,
            // Liste bağlamında (User->teams()) pivot doğrudan modelde; detay
            // bağlamında (Team::with('members')) members koleksiyonundan okunur.
            'my_role' => $this->pivot->role ?? $this->whenLoaded(
                'members',
                fn () => $this->members->firstWhere('id', $CurrentUser?->id)?->pivot->role,
            ),
            'members_count' => $this->members_count ?? $this->whenLoaded('members', fn () => $this->members->count()),
            'members' => TeamMemberResource::collection($this->whenLoaded('members')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
