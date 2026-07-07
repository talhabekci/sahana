<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDirectMessageRequest extends FormRequest
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
            'type' => ['required', 'string', 'in:text,image'],
            'body' => ['required_if:type,text', 'nullable', 'string', 'max:2000'],
            'image_path' => ['required_if:type,image', 'nullable', 'string', 'max:2048'],
        ];
    }
}
