<?php

namespace App\Http\Controllers;

use App\Actions\Waitlist\JoinWaitlist;
use App\Http\Requests\JoinWaitlistRequest;
use Illuminate\Http\JsonResponse;

class WaitlistController extends Controller
{
    public function store(JoinWaitlistRequest $Request, JoinWaitlist $Action): JsonResponse
    {
        $Action->handle($Request->validated('email'));

        return response()->json([
            'message' => 'Kadroya eklendin.',
        ], 201);
    }
}
