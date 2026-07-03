<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreLineupRequest extends FormRequest
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
            'formation' => ['sometimes', 'nullable', 'string', 'max:20'],
            'positions' => ['required', 'array', 'min:1'],
            'positions.*.id' => ['required', 'string'],
            'positions.*.x' => ['required', 'numeric', 'between:0,1'],
            'positions.*.y' => ['required', 'numeric', 'between:0,1'],
            'positions.*.label' => ['sometimes', 'nullable', 'string', 'max:20'],
            'positions.*.user_id' => ['sometimes', 'nullable', 'string'],
            'positions.*.guest_name' => ['sometimes', 'nullable', 'string', 'max:40'],
        ];
    }

    public function withValidator(Validator $Validator): void
    {
        $Validator->after(function (Validator $Validator): void {
            foreach ((array) $this->input('positions', []) as $Index => $Position) {
                $HasUser = ! empty($Position['user_id'] ?? null);
                $HasGuest = ! empty($Position['guest_name'] ?? null);

                if ($HasUser && $HasGuest) {
                    $Validator->errors()->add(
                        "positions.{$Index}",
                        'Bir pozisyon hem takım üyesi hem misafir olamaz.',
                    );
                }
            }
        });
    }
}
