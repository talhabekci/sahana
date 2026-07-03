<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateMeRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MeController extends Controller
{
    public function show(Request $Request): UserResource
    {
        /** @var User $User */
        $User = $Request->user();

        return new UserResource($User->load('profile.city'));
    }

    public function update(UpdateMeRequest $Request): UserResource
    {
        /** @var User $User */
        $User = $Request->user();

        if ($Request->safe()->has('name')) {
            $User->update(['name' => $Request->validated('name')]);
        }

        $ProfileData = $Request->safe()->except(['name']);

        if ($ProfileData !== []) {
            $Profile = $User->profile;

            if ($Profile === null) {
                // İlk profil oluşturma: NOT NULL alanların hepsi gelmiş olmalı
                foreach (['positions', 'level', 'city_id'] as $RequiredField) {
                    if (! array_key_exists($RequiredField, $ProfileData)) {
                        throw ValidationException::withMessages([
                            $RequiredField => ['Profil oluşturmak için bu alan zorunlu.'],
                        ]);
                    }
                }

                $User->profile()->create($ProfileData);
            } else {
                $Profile->update($ProfileData);
            }
        }

        return new UserResource($User->refresh()->load('profile.city'));
    }

    public function destroy(Request $Request): JsonResponse
    {
        /** @var User $User */
        $User = $Request->user();

        // KVKK: anonimleştir + soft delete; 30 gün sonra users:purge kalıcı siler.
        // phone/email null'lanır ki aynı kimlikle yeniden kayıt mümkün olsun (spec).
        $User->tokens()->delete();
        $User->forceFill([
            'name' => null,
            'email' => null,
            'phone' => null,
            'avatar_path' => null,
        ])->save();
        $User->delete();

        return response()->json(['data' => ['status' => 'deleted']]);
    }
}
