<?php

namespace App\Rules;

use App\Support\ProfanityFilter;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class NoProfanity implements ValidationRule
{
    public function validate(string $Attribute, mixed $Value, Closure $Fail): void
    {
        if (is_string($Value) && ProfanityFilter::containsProfanity($Value)) {
            $Fail('Metin uygunsuz içerik barındırıyor.');
        }
    }
}
