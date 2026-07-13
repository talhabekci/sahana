<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMatchRequest extends FormRequest
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
            'venue_id' => [
                'sometimes', 'nullable', 'string',
                Rule::exists('venues', 'public_id')->where('type', 'internal'),
            ],
            // BACKLOG #62: sosyalhalisaha_venues venues'e taşındı (type=sosyalhalisaha).
            'sosyalhalisaha_venue_id' => [
                'sometimes', 'nullable', 'integer',
                Rule::exists('venues', 'id')->where('type', 'sosyalhalisaha'),
            ],
            'venue_text' => ['required', 'string', 'max:120'],
            'venue_lat' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'venue_lng' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'starts_at' => ['required', 'date', 'after:now'],
            'format' => ['required', 'integer', 'between:5,8'],
            'price_per_player' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:10000'],
        ];
    }
}
