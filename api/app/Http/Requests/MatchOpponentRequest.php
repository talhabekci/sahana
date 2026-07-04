<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MatchOpponentRequest extends FormRequest
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
        ];
    }
}
