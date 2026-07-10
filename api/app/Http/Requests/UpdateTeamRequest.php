<?php

namespace App\Http\Requests;

use App\Models\Team;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeamRequest extends FormRequest
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
            'name' => ['sometimes', 'required', 'string', 'max:60'],
            'badge_icon' => ['sometimes', 'required', 'string', Rule::in(Team::BADGE_ICONS)],
            'logo' => ['sometimes', 'nullable', 'file', 'mimes:jpg,jpeg,png,webp,heic', 'max:10240'],
            'color_home' => ['sometimes', 'required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }
}
