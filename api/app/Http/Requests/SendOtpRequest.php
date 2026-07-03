<?php

namespace App\Http\Requests;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

class SendOtpRequest extends FormRequest
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
            'identifier' => ['required', 'string', 'max:100', self::identifierRule()],
        ];
    }

    public static function identifierRule(): Closure
    {
        return function (string $Attribute, mixed $Value, Closure $Fail): void {
            $IsEmail = is_string($Value) && filter_var($Value, FILTER_VALIDATE_EMAIL) !== false;
            $IsPhone = is_string($Value) && preg_match('/^\+?[0-9]{10,15}$/', $Value) === 1;

            if (! $IsEmail && ! $IsPhone) {
                $Fail('Geçerli bir telefon numarası veya e-posta adresi girin.');
            }
        };
    }
}
