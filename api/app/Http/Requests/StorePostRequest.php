<?php

namespace App\Http\Requests;

use App\Rules\NoProfanity;
use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
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
            'body' => ['required', 'string', 'max:500', new NoProfanity],
            'team_id' => ['sometimes', 'nullable', 'string', 'exists:teams,public_id'],
            'image' => ['sometimes', 'nullable', 'file', 'mimes:jpg,jpeg,png,webp,heic', 'max:10240'],
            'video' => [
                'sometimes',
                'nullable',
                'file',
                'mimes:mp4,mov,m4v',
                'mimetypes:video/mp4,video/quicktime,video/x-m4v',
                'max:102400',
                'prohibits:image',
            ],
            'lineup_id' => ['sometimes', 'nullable', 'string', 'exists:lineups,public_id'],
        ];
    }
}
