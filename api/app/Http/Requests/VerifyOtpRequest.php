<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $Identifier = $this->input('identifier');

        if (is_string($Identifier)) {
            $Identifier = trim($Identifier);

            if (str_contains($Identifier, '@')) {
                $Identifier = mb_strtolower($Identifier);
            }

            $this->merge(['identifier' => $Identifier]);
        }
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'identifier' => ['required', 'string', 'max:100', SendOtpRequest::identifierRule()],
            'code' => ['required', 'string', 'digits:6'],
        ];
    }
}
