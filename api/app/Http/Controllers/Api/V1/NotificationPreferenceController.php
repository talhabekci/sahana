<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateNotificationPreferencesRequest;
use App\Models\PlayerProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    public function show(Request $Request): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();
        $Profile = $User->profile;

        return response()->json(['data' => $this->serialize($Profile)]);
    }

    public function update(UpdateNotificationPreferencesRequest $Request): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();
        $Profile = $User->profile;

        if ($Profile === null) {
            abort(404);
        }

        $Update = [];

        if ($Request->safe()->has('quiet_hours_enabled')) {
            $Update['quiet_hours_enabled'] = $Request->validated('quiet_hours_enabled');
        }

        if ($Request->safe()->has('categories')) {
            $Update['notification_preferences'] = array_merge(
                $Profile->notification_preferences ?? [],
                $Request->validated('categories'),
            );
        }

        $Profile->update($Update);

        return response()->json(['data' => $this->serialize($Profile->fresh())]);
    }

    /** @return array<string, mixed> */
    private function serialize(?PlayerProfile $Profile): array
    {
        $Categories = [];

        foreach (PlayerProfile::NOTIFICATION_CATEGORIES as $Category) {
            $Categories[$Category] = $Profile?->wantsNotification($Category) ?? true;
        }

        return [
            'quiet_hours_enabled' => $Profile === null ? true : $Profile->quiet_hours_enabled,
            'categories' => $Categories,
        ];
    }
}
