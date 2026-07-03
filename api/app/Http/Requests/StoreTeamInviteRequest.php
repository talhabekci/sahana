<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTeamInviteRequest extends FormRequest
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
            'expires_at' => ['sometimes', 'nullable', 'date', 'after:now'],
            'max_uses' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
