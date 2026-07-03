<?php

namespace App\Http\Requests;

use App\Models\PlayerProfile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMeRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'positions' => ['sometimes', 'required', 'array', 'min:1'],
            'positions.*' => ['string', Rule::in(PlayerProfile::POSITIONS)],
            'foot' => ['sometimes', 'nullable', Rule::in(['L', 'R', 'B'])],
            'level' => ['sometimes', 'required', 'integer', 'between:1,5'],
            'city_id' => ['sometimes', 'required', 'integer', 'exists:cities,id'],
            'district' => ['sometimes', 'nullable', 'string', 'max:60'],
            'availability' => ['sometimes', 'nullable', 'array'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:160'],
        ];
    }
}
