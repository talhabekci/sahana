<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Match\ApplyToListing;
use App\Actions\Match\DecideApplication;
use App\Exceptions\ApiError;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreListingApplicationRequest;
use App\Http\Resources\ListingApplicationResource;
use App\Models\ListingApplication;
use App\Models\PlayerListing;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ListingApplicationController extends Controller
{
    public function store(
        StoreListingApplicationRequest $Request,
        PlayerListing $Listing,
        ApplyToListing $Action,
    ): JsonResponse {
        /** @var User $User */
        $User = $Request->user();

        $Application = $Action->handle($Listing, $User, $Request->validated('note'));
        $Application->load('user');

        return (new ListingApplicationResource($Application))->response()->setStatusCode(201);
    }

    public function approve(
        Request $Request,
        ListingApplication $Application,
        DecideApplication $Action,
    ): ListingApplicationResource {
        return new ListingApplicationResource(
            $Action->handle($Application, $this->captainOrFail($Request, $Application), true),
        );
    }

    public function reject(
        Request $Request,
        ListingApplication $Application,
        DecideApplication $Action,
    ): ListingApplicationResource {
        return new ListingApplicationResource(
            $Action->handle($Application, $this->captainOrFail($Request, $Application), false),
        );
    }

    private function captainOrFail(Request $Request, ListingApplication $Application): User
    {
        /** @var User $User */
        $User = $Request->user();

        if (! $Application->listing->match->isCaptain($User)) {
            throw new ApiError('Başvuruları sadece maçın kaptanı sonuçlandırabilir.', 'forbidden', 403);
        }

        return $User;
    }
}
