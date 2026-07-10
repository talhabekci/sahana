<?php

namespace App\Http\Requests;

use App\Models\Message;
use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
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
            'type' => ['required', 'string', 'in:'.implode(',', Message::TYPES)],
            'body' => ['required_if:type,text', 'nullable', 'string', 'max:2000'],
            'image' => ['required_if:type,image', 'nullable', 'file', 'mimes:jpg,jpeg,png,webp,heic', 'max:10240'],
            'audio' => ['required_if:type,audio', 'nullable', 'file', 'mimes:m4a,mp4,aac,wav,caf,mp3', 'max:5120'],
            'audio_duration' => ['nullable', 'integer', 'min:1', 'max:600'],
            'match_id' => ['required_if:type,match_ref', 'nullable', 'string'],
            'lineup_id' => ['required_if:type,lineup_ref', 'nullable', 'string'],
        ];
    }
}
