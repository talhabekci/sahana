<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Match\ChangeMatchStatus;
use App\Actions\Match\CreateMatch;
use App\Actions\Match\SubmitRsvp;
use App\Exceptions\ApiError;
use App\Http\Controllers\Controller;
use App\Http\Requests\RsvpRequest;
use App\Http\Requests\StoreMatchRequest;
use App\Http\Requests\UpdateMatchRequest;
use App\Http\Resources\MatchResource;
use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MatchController extends Controller
{
    private const SHOW_RELATIONS = ['team.members', 'opponentTeam', 'participants.user', 'listings'];

    public function index(Request $Request): AnonymousResourceCollection
    {
        /** @var User $User */
        $User = $Request->user();
        $Filter = $Request->query('filter', 'upcoming');

        $Query = FootballMatch::query()
            ->whereHas('participants', fn ($Builder) => $Builder->where('user_id', $User->id))
            ->with(['team', 'participants']);

        if ($Filter === 'past') {
            $Query->where('starts_at', '<', now())->orderByDesc('starts_at');
        } else {
            $Query->where('starts_at', '>=', now())->orderBy('starts_at');
        }

        return MatchResource::collection($Query->limit(50)->get());
    }

    public function store(StoreMatchRequest $Request, CreateMatch $Action): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();

        $Team = Team::where('public_id', $Request->validated('team_id'))->firstOrFail();

        /** @var array{venue_text: string, venue_lat?: float|null, venue_lng?: float|null, starts_at: string, format: int, price_per_player?: int|null} $Data */
        $Data = $Request->safe()->except(['team_id']);

        $Match = $Action->handle($Team, $User, $Data);
        $Match->load(self::SHOW_RELATIONS);

        return (new MatchResource($Match))->response()->setStatusCode(201);
    }

    public function show(Request $Request, FootballMatch $Match): MatchResource
    {
        $this->authorize('view', $Match);

        return new MatchResource($Match->load(self::SHOW_RELATIONS));
    }

    public function update(UpdateMatchRequest $Request, FootballMatch $Match): MatchResource
    {
        $this->authorize('manage', $Match);

        if (in_array($Match->status, ['played', 'cancelled'], true)) {
            throw new ApiError('Kapanmış maç güncellenemez.', 'match_closed');
        }

        $Match->update($Request->validated());

        return new MatchResource($Match->load(self::SHOW_RELATIONS));
    }

    public function confirm(Request $Request, FootballMatch $Match, ChangeMatchStatus $Action): MatchResource
    {
        $this->authorize('manage', $Match);

        return new MatchResource($Action->handle($Match, 'confirm')->load(self::SHOW_RELATIONS));
    }

    public function cancel(Request $Request, FootballMatch $Match, ChangeMatchStatus $Action): MatchResource
    {
        $this->authorize('manage', $Match);

        return new MatchResource($Action->handle($Match, 'cancel')->load(self::SHOW_RELATIONS));
    }

    public function rsvp(RsvpRequest $Request, FootballMatch $Match, SubmitRsvp $Action): MatchResource
    {
        /** @var User $User */
        $User = $Request->user();

        $Action->handle($Match, $User, $Request->validated('status'));

        return new MatchResource($Match->fresh(self::SHOW_RELATIONS));
    }
}
