<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMatchResultRequest extends FormRequest
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
            'home_score' => ['required', 'integer', 'between:0,50'],
            'away_score' => ['required', 'integer', 'between:0,50'],
            'no_show_user_ids' => ['sometimes', 'array'],
            'no_show_user_ids.*' => ['string', 'exists:users,public_id'],
        ];
    }
}
