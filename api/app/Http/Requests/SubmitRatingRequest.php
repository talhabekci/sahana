<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitRatingRequest extends FormRequest
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
            'ratee_id' => ['required', 'string', 'exists:users,public_id'],
            'score' => ['required', 'integer', 'between:1,10'],
        ];
    }
}
