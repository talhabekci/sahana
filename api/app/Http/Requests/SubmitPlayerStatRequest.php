<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitPlayerStatRequest extends FormRequest
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
            'user_id' => ['required', 'string', 'exists:users,public_id'],
            'goals' => ['required', 'integer', 'between:0,20'],
            'assists' => ['required', 'integer', 'between:0,20'],
        ];
    }
}
