<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOpponentListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'team_id' => ['required', 'string', 'exists:teams,public_id'],
            'match_id' => ['sometimes', 'nullable', 'string', 'exists:matches,public_id'],
            'note' => ['sometimes', 'nullable', 'string', 'max:200'],
            'lat' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'lng' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
        ];
    }
}
