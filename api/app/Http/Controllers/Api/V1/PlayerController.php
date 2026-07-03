<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlayerPublicResource;
use App\Models\User;

class PlayerController extends Controller
{
    public function show(string $PublicId): PlayerPublicResource
    {
        $User = User::query()
            ->where('public_id', $PublicId)
            ->with('profile.city')
            ->firstOrFail();

        return new PlayerPublicResource($User);
    }
}
