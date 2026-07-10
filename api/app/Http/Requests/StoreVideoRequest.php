<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVideoRequest extends FormRequest
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
            'url' => ['required_without:video', 'nullable', 'url', 'max:2048'],
            'video' => [
                'required_without:url',
                'nullable',
                'file',
                'mimes:mp4,mov,m4v',
                'mimetypes:video/mp4,video/quicktime,video/x-m4v',
                'max:61440',
            ],
            'duration_seconds' => ['nullable', 'integer', 'min:1', 'max:90'],
        ];
    }
}
