<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Team\CreateTeam;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeamRequest;
use App\Http\Requests\UpdateTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Support\ImageUploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TeamController extends Controller
{
    public function index(Request $Request): AnonymousResourceCollection
    {
        $Teams = $Request->user()->teams()->withCount('members')->get();

        return TeamResource::collection($Teams);
    }

    public function store(StoreTeamRequest $Request, CreateTeam $Action): JsonResponse
    {
        $Team = $Action->handle($Request->user(), $Request->validated());

        return (new TeamResource($Team->loadCount('members')))->response()->setStatusCode(201);
    }

    public function show(Request $Request, Team $Team): TeamResource
    {
        $this->authorize('view', $Team);

        return new TeamResource($Team->load('members')->loadCount('members'));
    }

    public function update(UpdateTeamRequest $Request, Team $Team): TeamResource
    {
        $this->authorize('update', $Team);

        $Data = $Request->validated();
        unset($Data['logo']);

        if ($Request->hasFile('logo')) {
            $Data['logo_path'] = ImageUploader::store($Request->file('logo'), 'teams');
        }

        $Team->update($Data);

        return new TeamResource($Team->fresh('members')->loadCount('members'));
    }

    public function destroy(Team $Team): JsonResponse
    {
        $this->authorize('delete', $Team);

        $Team->delete();

        return response()->json(['data' => ['status' => 'deleted']]);
    }
}
