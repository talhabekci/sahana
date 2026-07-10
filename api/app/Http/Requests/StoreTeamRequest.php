<?php

namespace App\Http\Requests;

use App\Models\Team;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTeamRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:60'],
            'badge_icon' => ['sometimes', 'nullable', 'string', Rule::in(Team::BADGE_ICONS)],
            'logo' => ['sometimes', 'nullable', 'file', 'mimes:jpg,jpeg,png,webp,heic', 'max:10240'],
            'color_home' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }

    public function withValidator(Validator $Validator): void
    {
        $Validator->after(function (Validator $Validator): void {
            if (empty($this->input('badge_icon')) && ! $this->hasFile('logo')) {
                $Validator->errors()->add('badge_icon', 'Bir arma ikonu seç ya da kendi görselini yükle.');
            }
        });
    }
}
