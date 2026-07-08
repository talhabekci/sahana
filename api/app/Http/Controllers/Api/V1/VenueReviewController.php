<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Venue\CreateVenueReview;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVenueReviewRequest;
use App\Http\Resources\VenueReviewResource;
use App\Models\User;
use App\Models\Venue;
use Illuminate\Http\JsonResponse;

class VenueReviewController extends Controller
{
    public function store(StoreVenueReviewRequest $Request, Venue $Venue, CreateVenueReview $Action): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();

        /** @var array{match_id: string, score: int, body?: string|null} $Data */
        $Data = $Request->validated();

        $Review = $Action->handle($Venue, $User, $Data);
        $Review->load('user');

        return (new VenueReviewResource($Review))->response()->setStatusCode(201);
    }
}
