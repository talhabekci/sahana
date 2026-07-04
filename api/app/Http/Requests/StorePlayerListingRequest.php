<?php

namespace App\Http\Requests;

use App\Models\PlayerProfile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePlayerListingRequest extends FormRequest
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
            'positions_needed' => ['required', 'array', 'min:1'],
            'positions_needed.*' => ['string', Rule::in(PlayerProfile::POSITIONS)],
            'needed_count' => ['required', 'integer', 'between:1,10'],
            'level_min' => ['required', 'integer', 'between:1,5'],
            'level_max' => ['required', 'integer', 'between:1,5'],
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ];
    }

    public function withValidator(Validator $Validator): void
    {
        $Validator->after(function (Validator $Validator): void {
            if ((int) $this->input('level_min', 1) > (int) $this->input('level_max', 5)) {
                $Validator->errors()->add('level_min', 'Alt seviye üst seviyeden büyük olamaz.');
            }
        });
    }
}
