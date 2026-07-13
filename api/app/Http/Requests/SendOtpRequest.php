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
            $this->merge(['identifier' => mb_strtolower(trim($Identifier))]);
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

    /**
     * BACKLOG #61: SMS sağlayıcısı entegre edilene kadar yalnızca e-posta
     * kabul edilir — telefon formatı kasıtlı olarak reddedilir. `users.phone`
     * ve `SmsSender` altyapısı silinmedi; sağlayıcı seçilince buraya tekrar
     * bir `IsPhone` dalı eklenip açılabilir.
     */
    public static function identifierRule(): Closure
    {
        return function (string $Attribute, mixed $Value, Closure $Fail): void {
            $IsEmail = is_string($Value) && filter_var($Value, FILTER_VALIDATE_EMAIL) !== false;

            if (! $IsEmail) {
                $Fail('Geçerli bir e-posta adresi girin.');
            }
        };
    }
}
