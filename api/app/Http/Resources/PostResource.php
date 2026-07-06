<?php

namespace App\Http\Resources;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Post
 */
class PostResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        $CurrentUser = $Request->user();

        return [
            'id' => $this->public_id,
            'type' => $this->type,
            'body' => $this->body,
            'author' => $this->whenLoaded('user', fn (): array => [
                'id' => $this->user->public_id,
                'name' => $this->user->name,
                'avatar_path' => $this->user->avatar_path,
            ]),
            'team' => $this->whenLoaded('team', fn (): ?array => $this->team !== null ? [
                'id' => $this->team->public_id,
                'name' => $this->team->name,
                'badge_icon' => $this->team->badge_icon,
                'color_home' => $this->team->color_home,
            ] : null),
            'match' => $this->whenLoaded('match', fn (): ?array => $this->match !== null ? [
                'id' => $this->match->public_id,
                'venue_text' => $this->match->venue_text,
                'starts_at' => $this->match->starts_at->toIso8601String(),
                'opponent_team_name' => $this->match->opponentTeam?->name,
            ] : null),
            'lineup' => $this->whenLoaded('lineup', fn (): ?array => $this->lineup !== null ? [
                'id' => $this->lineup->public_id,
                'name' => $this->lineup->name,
            ] : null),
            'likes_count' => $this->likes_count ?? $this->likes()->count(),
            'comments_count' => $this->comments_count ?? $this->comments()->count(),
            'i_liked' => $CurrentUser !== null && $this->likes()->where('user_id', $CurrentUser->id)->exists(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
