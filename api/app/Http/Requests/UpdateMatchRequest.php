<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMatchRequest extends FormRequest
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
            'venue_text' => ['sometimes', 'required', 'string', 'max:120'],
            'venue_lat' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'venue_lng' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'starts_at' => ['sometimes', 'required', 'date', 'after:now'],
            'format' => ['sometimes', 'required', 'integer', 'between:5,8'],
            'price_per_player' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:10000'],
        ];
    }
}
