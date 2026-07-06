<?php

namespace App\Http\Resources;

use App\Models\FootballMatch;
use App\Models\MatchParticipant;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin FootballMatch
 */
class MatchResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $Request): array
    {
        $CurrentUser = $Request->user();
        $MyParticipant = $CurrentUser !== null && $this->relationLoaded('participants')
            ? $this->participants->firstWhere('user_id', $CurrentUser->id)
            : null;

        return [
            'id' => $this->public_id,
            'team' => $this->whenLoaded('team', fn (): array => self::teamSummary($this->team)),
            'opponent_team' => $this->whenLoaded(
                'opponentTeam',
                fn (): ?array => $this->opponentTeam !== null ? self::teamSummary($this->opponentTeam) : null,
            ),
            'venue_text' => $this->venue_text,
            'venue_lat' => $this->venue_lat,
            'venue_lng' => $this->venue_lng,
            'starts_at' => $this->starts_at->toIso8601String(),
            'format' => $this->format,
            'price_per_player' => $this->price_per_player,
            'status' => $this->status,
            'my_rsvp' => $MyParticipant?->rsvp,
            'i_am_participant' => $MyParticipant !== null,
            'i_am_captain' => $this->whenLoaded(
                'team',
                fn (): bool => $CurrentUser !== null && $this->team->relationLoaded('members') && $this->team->isCaptain($CurrentUser),
            ),
            'rsvp_summary' => $this->whenLoaded('participants', fn (): array => [
                'yes' => $this->participants->where('rsvp', 'yes')->count(),
                'no' => $this->participants->where('rsvp', 'no')->count(),
                'maybe' => $this->participants->where('rsvp', 'maybe')->count(),
                'pending' => $this->participants->whereNull('rsvp')->count(),
            ]),
            'participants' => $this->whenLoaded('participants', fn (): array => $this->participants
                ->filter(fn (MatchParticipant $Participant): bool => $Participant->relationLoaded('user'))
                ->map(fn (MatchParticipant $Participant): array => [
                    'id' => $Participant->user->public_id,
                    'name' => $Participant->user->name,
                    'rsvp' => $Participant->rsvp,
                    'source' => $Participant->source,
                ])->values()->all()),
            'listings' => $this->whenLoaded('listings', fn (): array => $this->listings
                ->map(fn ($Listing): array => [
                    'id' => $Listing->public_id,
                    'status' => $Listing->status,
                    'needed_count' => $Listing->needed_count,
                    'positions_needed' => $Listing->positions_needed,
                ])->values()->all()),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array{id: string, name: string, badge_icon: string, color_home: string}
     */
    private static function teamSummary(Team $Team): array
    {
        return [
            'id' => $Team->public_id,
            'name' => $Team->name,
            'badge_icon' => $Team->badge_icon,
            'color_home' => $Team->color_home,
        ];
    }
}
