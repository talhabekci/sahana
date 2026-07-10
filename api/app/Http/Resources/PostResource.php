<?php

namespace App\Http\Resources;

use App\Models\Post;
use App\Support\ImageUploader;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            'image_url' => $this->image_path !== null ? Storage::disk('public')->url($this->image_path) : null,
            'author' => $this->whenLoaded('user', fn (): array => [
                'id' => $this->user->public_id,
                'name' => $this->user->name,
                'avatar_path' => ImageUploader::url($this->user->avatar_path),
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
            'lineup' => $this->whenLoaded('lineup', fn (): ?array => $this->lineup !== null
                ? (new LineupResource($this->lineup))->resolve($Request)
                : null),
            'player_listing' => $this->whenLoaded('playerListing', fn (): ?array => $this->playerListing !== null
                ? (new PlayerListingResource($this->playerListing))->resolve($Request)
                : null),
            'opponent_listing' => $this->whenLoaded('opponentListing', fn (): ?array => $this->opponentListing !== null
                ? (new OpponentListingResource($this->opponentListing))->resolve($Request)
                : null),
            'video' => $this->whenLoaded('video', fn (): ?array => $this->video !== null ? [
                'id' => $this->video->public_id,
                'url' => $this->video->url,
                'provider' => $this->video->provider,
                'title' => $this->video->title,
                'thumbnail_url' => $this->video->thumbnail_url,
            ] : null),
            'likes_count' => $this->likes_count ?? $this->likes()->count(),
            'comments_count' => $this->comments_count ?? $this->comments()->count(),
            'i_liked' => $CurrentUser !== null && $this->likes()->where('user_id', $CurrentUser->id)->exists(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
