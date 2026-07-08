<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVenueReviewRequest extends FormRequest
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
            'match_id' => ['required', 'string', 'exists:matches,public_id'],
            'score' => ['required', 'integer', 'between:1,5'],
            'body' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
